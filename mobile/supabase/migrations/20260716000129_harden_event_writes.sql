-- Harden event write RPCs so SECURITY DEFINER paths enforce the same
-- editability and atomicity rules expected by direct RLS-protected writes.

CREATE OR REPLACE FUNCTION public.save_event_with_optional_room_reservation(
  p_event_id UUID DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'geral',
  p_description TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_start_at TIMESTAMPTZ DEFAULT NULL,
  p_end_at TIMESTAMPTZ DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT true,
  p_visible_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  p_room_id UUID DEFAULT NULL
)
RETURNS public.events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_existing_event public.events%ROWTYPE;
  v_visible_user_ids UUID[] := COALESCE(p_visible_user_ids, ARRAY[]::UUID[]);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  IF NOT public.can_manage_events() THEN
    RAISE EXCEPTION 'Usuario sem permissao para salvar eventos.';
  END IF;

  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'Titulo do evento e obrigatorio.';
  END IF;

  IF p_start_at IS NULL OR p_end_at IS NULL THEN
    RAISE EXCEPTION 'Intervalo do evento invalido.';
  END IF;

  IF p_start_at <= now() THEN
    RAISE EXCEPTION 'Evento deve comecar no futuro.';
  END IF;

  IF p_end_at <= p_start_at THEN
    RAISE EXCEPTION 'A data final deve ser maior que a data inicial.';
  END IF;

  IF p_event_id IS NULL THEN
    INSERT INTO public.events (
      title,
      category,
      description,
      location,
      start_at,
      end_at,
      is_public,
      created_by
    )
    VALUES (
      btrim(p_title),
      p_category,
      p_description,
      p_location,
      p_start_at,
      p_end_at,
      p_is_public,
      auth.uid()
    )
    RETURNING *
    INTO v_event;
  ELSE
    SELECT *
    INTO v_existing_event
    FROM public.events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Evento nao encontrado.';
    END IF;

    IF v_existing_event.start_at <= now() THEN
      RAISE EXCEPTION 'Evento nao pode ser alterado no horario de inicio ou depois dele.';
    END IF;

    UPDATE public.events
    SET title = btrim(p_title),
        category = p_category,
        description = p_description,
        location = p_location,
        start_at = p_start_at,
        end_at = p_end_at,
        is_public = p_is_public
    WHERE id = p_event_id
    RETURNING *
    INTO v_event;
  END IF;

  DELETE FROM public.event_audiences
  WHERE event_id = v_event.id;

  IF p_is_public = false AND cardinality(v_visible_user_ids) > 0 THEN
    INSERT INTO public.event_audiences (event_id, user_id)
    SELECT v_event.id, visible_user_id
    FROM (
      SELECT DISTINCT unnest(v_visible_user_ids) AS visible_user_id
    ) visible_users
    WHERE visible_user_id IS NOT NULL;
  END IF;

  DELETE FROM public.room_reservations
  WHERE event_id = v_event.id
    AND status = 'active';

  IF p_room_id IS NOT NULL THEN
    INSERT INTO public.room_reservations (
      room_id,
      event_id,
      reserved_by,
      start_at,
      end_at,
      purpose,
      category,
      status
    )
    VALUES (
      p_room_id,
      v_event.id,
      auth.uid(),
      p_start_at,
      p_end_at,
      btrim(p_title),
      p_category,
      'active'
    );
  END IF;

  RETURN v_event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_event_with_optional_room_reservation(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TIMESTAMPTZ,
  TIMESTAMPTZ,
  BOOLEAN,
  UUID[],
  UUID
) TO authenticated;

DROP FUNCTION IF EXISTS public.create_events_with_audiences(JSONB);

CREATE OR REPLACE FUNCTION public.create_events_with_audiences(
  p_events JSONB
)
RETURNS SETOF public.events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_data JSONB;
  v_event public.events%ROWTYPE;
  v_title TEXT;
  v_category TEXT;
  v_description TEXT;
  v_location TEXT;
  v_start_at TIMESTAMPTZ;
  v_end_at TIMESTAMPTZ;
  v_is_public BOOLEAN;
  v_visible_user_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  IF NOT public.can_manage_events() THEN
    RAISE EXCEPTION 'Usuario sem permissao para salvar eventos.';
  END IF;

  IF p_events IS NULL OR jsonb_typeof(p_events) <> 'array' THEN
    RAISE EXCEPTION 'Lista de eventos invalida.';
  END IF;

  FOR v_event_data IN
    SELECT value
    FROM jsonb_array_elements(p_events)
  LOOP
    IF jsonb_typeof(v_event_data) <> 'object' THEN
      RAISE EXCEPTION 'Evento invalido na lista.';
    END IF;

    v_title := btrim(COALESCE(v_event_data->>'title', ''));
    v_category := COALESCE(NULLIF(btrim(COALESCE(v_event_data->>'category', '')), ''), 'geral');
    v_description := NULLIF(v_event_data->>'description', '');
    v_location := NULLIF(v_event_data->>'location', '');
    v_start_at := NULLIF(v_event_data->>'start_at', '')::TIMESTAMPTZ;
    v_end_at := NULLIF(v_event_data->>'end_at', '')::TIMESTAMPTZ;
    v_is_public := COALESCE((v_event_data->>'is_public')::BOOLEAN, true);
    v_visible_user_ids := ARRAY[]::UUID[];

    IF v_title = '' THEN
      RAISE EXCEPTION 'Titulo do evento e obrigatorio.';
    END IF;

    IF v_start_at IS NULL OR v_end_at IS NULL THEN
      RAISE EXCEPTION 'Intervalo do evento invalido.';
    END IF;

    IF v_start_at <= now() THEN
      RAISE EXCEPTION 'Evento deve comecar no futuro.';
    END IF;

    IF v_end_at <= v_start_at THEN
      RAISE EXCEPTION 'A data final deve ser maior que a data inicial.';
    END IF;

    IF jsonb_typeof(COALESCE(v_event_data->'visible_to_user_ids', '[]'::JSONB)) <> 'array' THEN
      RAISE EXCEPTION 'Audiencia do evento invalida.';
    END IF;

    IF v_is_public = false THEN
      SELECT COALESCE(array_agg(DISTINCT visible_user_id), ARRAY[]::UUID[])
      INTO v_visible_user_ids
      FROM (
        SELECT NULLIF(btrim(visible_user.value), '')::UUID AS visible_user_id
        FROM jsonb_array_elements_text(
          COALESCE(v_event_data->'visible_to_user_ids', '[]'::JSONB)
        ) AS visible_user(value)
        WHERE NULLIF(btrim(visible_user.value), '') IS NOT NULL
      ) visible_users;
    END IF;

    INSERT INTO public.events (
      title,
      category,
      description,
      location,
      start_at,
      end_at,
      is_public,
      created_by
    )
    VALUES (
      v_title,
      v_category,
      v_description,
      v_location,
      v_start_at,
      v_end_at,
      v_is_public,
      auth.uid()
    )
    RETURNING *
    INTO v_event;

    IF v_is_public = false AND cardinality(v_visible_user_ids) > 0 THEN
      INSERT INTO public.event_audiences (event_id, user_id)
      SELECT v_event.id, visible_user_id
      FROM unnest(v_visible_user_ids) AS visible_user_id
      WHERE visible_user_id IS NOT NULL;
    END IF;

    RETURN NEXT v_event;
  END LOOP;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_events_with_audiences(JSONB)
  TO authenticated;
