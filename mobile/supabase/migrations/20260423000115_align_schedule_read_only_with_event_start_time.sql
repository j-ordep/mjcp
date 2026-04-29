-- Align schedule read-only rules with the exact event start timestamp.
-- New rule:
-- - before event.start_at: allowed according to role/policy
-- - at event.start_at or after: schedule flow becomes read-only

-- IMPORTANT:
-- Do not reference `events` directly inside `schedules` policies because
-- `events` SELECT policy already references `schedules`, which causes
-- infinite recursion in RLS evaluation.
-- Use SECURITY DEFINER helpers as the source of truth for time checks.

CREATE OR REPLACE FUNCTION public.is_event_editable_before_start(p_event_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = p_event_id
      AND e.start_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_schedule_editable_before_start(p_schedule_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.schedules s
    JOIN public.events e
      ON e.id = s.event_id
    WHERE s.id = p_schedule_id
      AND e.start_at > now()
  );
$$;

-- =========================
-- EVENTS POLICIES (ADMIN)
-- Editable until the exact event start time.
-- =========================
DROP POLICY IF EXISTS "Admin can update editable events" ON public.events;
DROP POLICY IF EXISTS "Admin can delete editable events" ON public.events;

CREATE POLICY "Admin can update editable events"
  ON public.events
  FOR UPDATE
  USING (
    is_admin()
    AND start_at > now()
  )
  WITH CHECK (
    is_admin()
    AND start_at > now()
  );

CREATE POLICY "Admin can delete editable events"
  ON public.events
  FOR DELETE
  USING (
    is_admin()
    AND start_at > now()
  );

-- =========================
-- SCHEDULES POLICIES
-- Editable until the exact event start time.
-- =========================
DROP POLICY IF EXISTS "Admin can insert editable schedules" ON public.schedules;
DROP POLICY IF EXISTS "Admin can update editable schedules" ON public.schedules;
DROP POLICY IF EXISTS "Admin can delete editable schedules" ON public.schedules;
DROP POLICY IF EXISTS "Leaders can insert editable schedules" ON public.schedules;
DROP POLICY IF EXISTS "Leaders can update editable schedules" ON public.schedules;
DROP POLICY IF EXISTS "Leaders can delete editable schedules" ON public.schedules;

CREATE POLICY "Admin can insert editable schedules"
  ON public.schedules
  FOR INSERT
  WITH CHECK (
    is_admin()
    AND public.is_event_editable_before_start(event_id)
  );

CREATE POLICY "Admin can update editable schedules"
  ON public.schedules
  FOR UPDATE
  USING (
    is_admin()
    AND public.is_event_editable_before_start(event_id)
  )
  WITH CHECK (
    is_admin()
    AND public.is_event_editable_before_start(event_id)
  );

CREATE POLICY "Admin can delete editable schedules"
  ON public.schedules
  FOR DELETE
  USING (
    is_admin()
    AND public.is_event_editable_before_start(event_id)
  );

CREATE POLICY "Leaders can insert editable schedules"
  ON public.schedules
  FOR INSERT
  WITH CHECK (
    is_ministry_leader(ministry_id)
    AND public.is_event_editable_before_start(event_id)
  );

CREATE POLICY "Leaders can update editable schedules"
  ON public.schedules
  FOR UPDATE
  USING (
    is_ministry_leader(ministry_id)
    AND public.is_event_editable_before_start(event_id)
  )
  WITH CHECK (
    is_ministry_leader(ministry_id)
    AND public.is_event_editable_before_start(event_id)
  );

CREATE POLICY "Leaders can delete editable schedules"
  ON public.schedules
  FOR DELETE
  USING (
    is_ministry_leader(ministry_id)
    AND public.is_event_editable_before_start(event_id)
  );

-- =========================
-- SCHEDULE_ASSIGNMENTS POLICIES
-- Editable until the exact event start time.
-- =========================
DROP POLICY IF EXISTS "Admin can insert editable assignments" ON public.schedule_assignments;
DROP POLICY IF EXISTS "Admin can update editable assignments" ON public.schedule_assignments;
DROP POLICY IF EXISTS "Admin can delete editable assignments" ON public.schedule_assignments;
DROP POLICY IF EXISTS "Leaders can insert editable assignments" ON public.schedule_assignments;
DROP POLICY IF EXISTS "Leaders can update editable assignments" ON public.schedule_assignments;
DROP POLICY IF EXISTS "Leaders can delete editable assignments" ON public.schedule_assignments;
DROP POLICY IF EXISTS "Users can update own assignment status before event day" ON public.schedule_assignments;

CREATE POLICY "Admin can insert editable assignments"
  ON public.schedule_assignments
  FOR INSERT
  WITH CHECK (
    is_admin()
    AND public.is_schedule_editable_before_start(schedule_id)
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_roles mr ON mr.id = schedule_assignments.role_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mr.ministry_id = s.ministry_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_members mm ON mm.ministry_id = s.ministry_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mm.user_id = schedule_assignments.user_id
    )
  );

CREATE POLICY "Admin can update editable assignments"
  ON public.schedule_assignments
  FOR UPDATE
  USING (
    is_admin()
    AND public.is_schedule_editable_before_start(schedule_id)
  )
  WITH CHECK (
    is_admin()
    AND public.is_schedule_editable_before_start(schedule_id)
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_roles mr ON mr.id = schedule_assignments.role_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mr.ministry_id = s.ministry_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_members mm ON mm.ministry_id = s.ministry_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mm.user_id = schedule_assignments.user_id
    )
  );

CREATE POLICY "Admin can delete editable assignments"
  ON public.schedule_assignments
  FOR DELETE
  USING (
    is_admin()
    AND public.is_schedule_editable_before_start(schedule_id)
  );

CREATE POLICY "Leaders can insert editable assignments"
  ON public.schedule_assignments
  FOR INSERT
  WITH CHECK (
    public.is_schedule_editable_before_start(schedule_id)
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      WHERE s.id = schedule_assignments.schedule_id
        AND is_ministry_leader(s.ministry_id)
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_roles mr ON mr.id = schedule_assignments.role_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mr.ministry_id = s.ministry_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_members mm ON mm.ministry_id = s.ministry_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mm.user_id = schedule_assignments.user_id
    )
  );

CREATE POLICY "Leaders can update editable assignments"
  ON public.schedule_assignments
  FOR UPDATE
  USING (
    public.is_schedule_editable_before_start(schedule_id)
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      WHERE s.id = schedule_assignments.schedule_id
        AND is_ministry_leader(s.ministry_id)
    )
  )
  WITH CHECK (
    public.is_schedule_editable_before_start(schedule_id)
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      WHERE s.id = schedule_assignments.schedule_id
        AND is_ministry_leader(s.ministry_id)
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_roles mr ON mr.id = schedule_assignments.role_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mr.ministry_id = s.ministry_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_members mm ON mm.ministry_id = s.ministry_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mm.user_id = schedule_assignments.user_id
    )
  );

CREATE POLICY "Leaders can delete editable assignments"
  ON public.schedule_assignments
  FOR DELETE
  USING (
    public.is_schedule_editable_before_start(schedule_id)
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      WHERE s.id = schedule_assignments.schedule_id
        AND is_ministry_leader(s.ministry_id)
    )
  );

CREATE POLICY "Users can update own assignment status before event start"
  ON public.schedule_assignments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND public.is_schedule_editable_before_start(schedule_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_schedule_editable_before_start(schedule_id)
  );

-- =========================
-- SWAP RPCS / TRIGGERS
-- Block exactly at event.start_at.
-- =========================
CREATE OR REPLACE FUNCTION public.accept_swap_request(p_swap_request_id UUID)
RETURNS public.swap_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.swap_requests%ROWTYPE;
  v_assignment RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  SELECT *
  INTO v_request
  FROM public.swap_requests
  WHERE id = p_swap_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao de troca nao encontrada.';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Esta solicitacao ja foi processada.';
  END IF;

  SELECT sa.*, s.ministry_id, e.start_at AS event_start_at
  INTO v_assignment
  FROM public.schedule_assignments sa
  JOIN public.schedules s
    ON s.id = sa.schedule_id
  JOIN public.events e
    ON e.id = s.event_id
  WHERE sa.id = v_request.from_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment de origem nao encontrado.';
  END IF;

  IF v_assignment.event_start_at <= now() THEN
    RAISE EXCEPTION 'A escala nao aceita trocas no horario do evento ou depois dele.';
  END IF;

  IF v_assignment.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Voce nao pode aceitar a propria solicitacao.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.ministry_members mm
    JOIN public.ministry_member_roles mmr
      ON mmr.member_id = mm.id
     AND mmr.role_id = v_assignment.role_id
    WHERE mm.user_id = auth.uid()
      AND mm.ministry_id = v_assignment.ministry_id
  ) THEN
    RAISE EXCEPTION 'Voce nao e elegivel para esta troca.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.schedule_assignments sa
    WHERE sa.schedule_id = v_assignment.schedule_id
      AND sa.user_id = auth.uid()
      AND sa.role_id = v_assignment.role_id
      AND sa.id <> v_assignment.id
  ) THEN
    RAISE EXCEPTION 'Voce ja esta escalado nesta mesma funcao.';
  END IF;

  UPDATE public.swap_requests
  SET status = 'approved',
      to_user_id = auth.uid(),
      updated_at = now()
  WHERE id = v_request.id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Esta solicitacao ja foi aceita por outra pessoa.';
  END IF;

  UPDATE public.schedule_assignments
  SET user_id = auth.uid(),
      status = 'pending',
      confirmed_at = NULL
  WHERE id = v_assignment.id;

  UPDATE public.swap_requests
  SET status = 'cancelled',
      updated_at = now()
  WHERE from_assignment_id = v_assignment.id
    AND id <> v_request.id
    AND status = 'pending';

  PERFORM public.notify_swap_request_accepted(v_request.id, auth.uid());

  RETURN (
    SELECT sr
    FROM public.swap_requests sr
    WHERE sr.id = v_request.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_own_swap_request(p_swap_request_id UUID)
RETURNS public.swap_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  SELECT sr.*, e.start_at AS event_start_at
  INTO v_request
  FROM public.swap_requests sr
  JOIN public.schedule_assignments sa
    ON sa.id = sr.from_assignment_id
  JOIN public.schedules s
    ON s.id = sa.schedule_id
  JOIN public.events e
    ON e.id = s.event_id
  WHERE sr.id = p_swap_request_id
    AND sa.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao nao encontrada.';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Somente solicitacoes pendentes podem ser canceladas.';
  END IF;

  IF v_request.event_start_at <= now() THEN
    RAISE EXCEPTION 'A escala nao permite cancelar trocas no horario do evento ou depois dele.';
  END IF;

  UPDATE public.swap_requests
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = v_request.id;

  PERFORM public.notify_swap_request_cancelled(v_request.id, auth.uid());

  RETURN (
    SELECT sr
    FROM public.swap_requests sr
    WHERE sr.id = v_request.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_swap_request_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment RECORD;
  v_schedule_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  SELECT sa.*, e.start_at AS event_start_at
  INTO v_assignment
  FROM public.schedule_assignments sa
  JOIN public.schedules s
    ON s.id = sa.schedule_id
  JOIN public.events e
    ON e.id = s.event_id
  WHERE sa.id = NEW.from_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment de origem nao encontrado.';
  END IF;

  IF v_assignment.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Voce so pode solicitar troca para o proprio assignment.';
  END IF;

  IF v_assignment.event_start_at <= now() THEN
    RAISE EXCEPTION 'A escala nao aceita novas trocas no horario do evento ou depois dele.';
  END IF;

  v_schedule_id := v_assignment.schedule_id;

  IF EXISTS (
    SELECT 1
    FROM public.swap_requests sr
    WHERE sr.from_assignment_id = NEW.from_assignment_id
      AND sr.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Ja existe uma solicitacao pendente para esta funcao.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.swap_requests sr
    JOIN public.schedule_assignments sa
      ON sa.id = sr.from_assignment_id
    WHERE sr.status = 'pending'
      AND sa.schedule_id = v_schedule_id
      AND sa.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Voce ja possui uma solicitacao pendente para esta escala. Cancele a solicitacao atual antes de pedir outra.';
  END IF;

  RETURN NEW;
END;
$$;
