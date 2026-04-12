-- Swap request notifications:
-- - create notifications for leaders and eligible members when a swap is created
-- - notify requester and leaders when a swap is accepted
-- - notify leaders when a swap is cancelled

CREATE OR REPLACE FUNCTION public.notify_swap_request_created(p_swap_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  SELECT
    sr.id,
    sr.from_assignment_id,
    sa.schedule_id,
    sa.user_id AS requester_user_id,
    sa.role_id,
    s.event_id,
    s.ministry_id,
    COALESCE(requester.full_name, 'Um membro') AS requester_name,
    COALESCE(role.name, 'Funcao') AS role_name,
    COALESCE(event.title, 'um evento') AS event_title
  INTO v_request
  FROM public.swap_requests sr
  JOIN public.schedule_assignments sa
    ON sa.id = sr.from_assignment_id
  JOIN public.schedules s
    ON s.id = sa.schedule_id
  JOIN public.events event
    ON event.id = s.event_id
  LEFT JOIN public.profiles requester
    ON requester.id = sa.user_id
  LEFT JOIN public.ministry_roles role
    ON role.id = sa.role_id
  WHERE sr.id = p_swap_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao de troca nao encontrada para notificacao.';
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT DISTINCT
    recipients.user_id,
    'Nova solicitacao de troca',
    format(
      '%s solicitou troca para %s em %s.',
      v_request.requester_name,
      v_request.role_name,
      v_request.event_title
    ),
    'swap_request',
    jsonb_build_object(
      'action', 'created',
      'swap_request_id', v_request.id,
      'schedule_id', v_request.schedule_id,
      'event_id', v_request.event_id,
      'ministry_id', v_request.ministry_id,
      'assignment_id', v_request.from_assignment_id,
      'role_id', v_request.role_id,
      'actor_user_id', v_request.requester_user_id
    )
  FROM (
    SELECT mm.user_id
    FROM public.ministry_members mm
    WHERE mm.ministry_id = v_request.ministry_id
      AND mm.is_leader = true
      AND mm.user_id <> v_request.requester_user_id

    UNION

    SELECT mm.user_id
    FROM public.ministry_members mm
    JOIN public.ministry_member_roles mmr
      ON mmr.member_id = mm.id
     AND mmr.role_id = v_request.role_id
    WHERE mm.ministry_id = v_request.ministry_id
      AND mm.user_id <> v_request.requester_user_id
  ) AS recipients;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_swap_request_accepted(
  p_swap_request_id UUID,
  p_actor_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  SELECT
    sr.id,
    sr.from_assignment_id,
    sr.to_user_id,
    sa.schedule_id,
    sa.user_id AS requester_user_id,
    sa.role_id,
    s.event_id,
    s.ministry_id,
    COALESCE(actor.full_name, 'Um membro') AS actor_name,
    COALESCE(role.name, 'Funcao') AS role_name,
    COALESCE(event.title, 'um evento') AS event_title
  INTO v_request
  FROM public.swap_requests sr
  JOIN public.schedule_assignments sa
    ON sa.id = sr.from_assignment_id
  JOIN public.schedules s
    ON s.id = sa.schedule_id
  JOIN public.events event
    ON event.id = s.event_id
  LEFT JOIN public.profiles actor
    ON actor.id = p_actor_user_id
  LEFT JOIN public.ministry_roles role
    ON role.id = sa.role_id
  WHERE sr.id = p_swap_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao de troca nao encontrada para notificacao.';
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT DISTINCT
    recipients.user_id,
    'Troca assumida',
    format(
      '%s assumiu a funcao %s em %s.',
      v_request.actor_name,
      v_request.role_name,
      v_request.event_title
    ),
    'swap_request',
    jsonb_build_object(
      'action', 'accepted',
      'swap_request_id', v_request.id,
      'schedule_id', v_request.schedule_id,
      'event_id', v_request.event_id,
      'ministry_id', v_request.ministry_id,
      'assignment_id', v_request.from_assignment_id,
      'role_id', v_request.role_id,
      'actor_user_id', p_actor_user_id
    )
  FROM (
    SELECT v_request.requester_user_id AS user_id

    UNION

    SELECT mm.user_id
    FROM public.ministry_members mm
    WHERE mm.ministry_id = v_request.ministry_id
      AND mm.is_leader = true
  ) AS recipients
  WHERE recipients.user_id <> p_actor_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_swap_request_cancelled(
  p_swap_request_id UUID,
  p_actor_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  SELECT
    sr.id,
    sr.from_assignment_id,
    sa.schedule_id,
    sa.user_id AS requester_user_id,
    sa.role_id,
    s.event_id,
    s.ministry_id,
    COALESCE(actor.full_name, 'Um membro') AS actor_name,
    COALESCE(role.name, 'Funcao') AS role_name,
    COALESCE(event.title, 'um evento') AS event_title
  INTO v_request
  FROM public.swap_requests sr
  JOIN public.schedule_assignments sa
    ON sa.id = sr.from_assignment_id
  JOIN public.schedules s
    ON s.id = sa.schedule_id
  JOIN public.events event
    ON event.id = s.event_id
  LEFT JOIN public.profiles actor
    ON actor.id = p_actor_user_id
  LEFT JOIN public.ministry_roles role
    ON role.id = sa.role_id
  WHERE sr.id = p_swap_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao de troca nao encontrada para notificacao.';
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT
    mm.user_id,
    'Troca cancelada',
    format(
      '%s cancelou a solicitacao de troca para %s em %s.',
      v_request.actor_name,
      v_request.role_name,
      v_request.event_title
    ),
    'swap_request',
    jsonb_build_object(
      'action', 'cancelled',
      'swap_request_id', v_request.id,
      'schedule_id', v_request.schedule_id,
      'event_id', v_request.event_id,
      'ministry_id', v_request.ministry_id,
      'assignment_id', v_request.from_assignment_id,
      'role_id', v_request.role_id,
      'actor_user_id', p_actor_user_id
    )
  FROM public.ministry_members mm
  WHERE mm.ministry_id = v_request.ministry_id
    AND mm.is_leader = true
    AND mm.user_id <> p_actor_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_swap_request_created_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_swap_request_created(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS swap_requests_notify_created ON public.swap_requests;

CREATE TRIGGER swap_requests_notify_created
  AFTER INSERT ON public.swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_swap_request_created_trigger();

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

  IF v_request.event_start_at::date <= current_date THEN
    RAISE EXCEPTION 'A escala nao permite cancelar trocas no dia do evento ou depois dele.';
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
