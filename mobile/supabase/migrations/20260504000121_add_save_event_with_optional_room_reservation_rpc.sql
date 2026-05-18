DROP FUNCTION IF EXISTS public.save_event_with_optional_room_reservation(
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
);

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
  v_visible_user_ids UUID[] := COALESCE(p_visible_user_ids, ARRAY[]::UUID[]);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem salvar eventos.';
  END IF;

  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'Titulo do evento e obrigatorio.';
  END IF;

  IF p_start_at IS NULL OR p_end_at IS NULL THEN
    RAISE EXCEPTION 'Intervalo do evento invalido.';
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

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Evento nao encontrado.';
    END IF;
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
