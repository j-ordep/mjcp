-- Swap requests follow the same product rule:
-- on the event day or after, the schedule becomes read-only.

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

  IF v_assignment.event_start_at::date <= current_date THEN
    RAISE EXCEPTION 'A escala nao aceita trocas no dia do evento ou depois dele.';
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

  IF v_request.event_start_at::date <= current_date THEN
    RAISE EXCEPTION 'A escala nao permite cancelar trocas no dia do evento ou depois dele.';
  END IF;

  UPDATE public.swap_requests
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = v_request.id;

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

  IF v_assignment.event_start_at::date <= current_date THEN
    RAISE EXCEPTION 'A escala nao aceita novas trocas no dia do evento ou depois dele.';
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
