ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS can_manage_events BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.can_manage_events()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR can_manage_events = true
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_editable_before_start(p_event_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = p_event_id
      AND e.start_at > now()
  );
$$;

DROP POLICY IF EXISTS "Admin can insert events" ON public.events;
DROP POLICY IF EXISTS "Admin can update editable events" ON public.events;
DROP POLICY IF EXISTS "Admin can delete editable events" ON public.events;
DROP POLICY IF EXISTS "Event managers can insert events" ON public.events;
DROP POLICY IF EXISTS "Event managers can update editable events" ON public.events;
DROP POLICY IF EXISTS "Event managers can delete editable events" ON public.events;

CREATE POLICY "Event managers can insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (public.can_manage_events());

CREATE POLICY "Event managers can update editable events"
  ON public.events
  FOR UPDATE
  USING (
    public.can_manage_events()
    AND start_at > now()
  )
  WITH CHECK (
    public.can_manage_events()
    AND start_at > now()
  );

CREATE POLICY "Event managers can delete editable events"
  ON public.events
  FOR DELETE
  USING (
    public.can_manage_events()
    AND start_at > now()
  );

DROP POLICY IF EXISTS "Admins and selected users can read event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Admins can insert event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Admins can update event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Admins can delete event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Event managers and selected users can read event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Event managers can insert event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Event managers can update event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Event managers can delete event audiences" ON public.event_audiences;

CREATE POLICY "Event managers and selected users can read event audiences"
  ON public.event_audiences
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.can_manage_events()
      OR user_id = auth.uid()
    )
  );

CREATE POLICY "Event managers can insert event audiences"
  ON public.event_audiences
  FOR INSERT
  WITH CHECK (
    public.can_manage_events()
    AND public.is_event_editable_before_start(event_id)
  );

CREATE POLICY "Event managers can update event audiences"
  ON public.event_audiences
  FOR UPDATE
  USING (
    public.can_manage_events()
    AND public.is_event_editable_before_start(event_id)
  )
  WITH CHECK (
    public.can_manage_events()
    AND public.is_event_editable_before_start(event_id)
  );

CREATE POLICY "Event managers can delete event audiences"
  ON public.event_audiences
  FOR DELETE
  USING (
    public.can_manage_events()
    AND public.is_event_editable_before_start(event_id)
  );

DROP POLICY IF EXISTS "Public events readable by all" ON public.events;

CREATE POLICY "Public events readable by all"
  ON public.events
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      is_public = true
      OR public.can_manage_events()
      OR EXISTS (
        SELECT 1
        FROM public.event_audiences event_audience
        WHERE event_audience.event_id = events.id
          AND event_audience.user_id = auth.uid()
      )
    )
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

  IF NOT public.can_manage_events() THEN
    RAISE EXCEPTION 'Usuario sem permissao para salvar eventos.';
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
