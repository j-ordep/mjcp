CREATE OR REPLACE FUNCTION public.notify_schedule_assignment_created(p_assignment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment RECORD;
BEGIN
  SELECT
    sa.id,
    sa.schedule_id,
    sa.user_id,
    sa.role_id,
    s.event_id,
    s.ministry_id,
    COALESCE(role.name, 'uma funcao') AS role_name,
    COALESCE(event.title, 'um evento') AS event_title
  INTO v_assignment
  FROM public.schedule_assignments sa
  JOIN public.schedules s
    ON s.id = sa.schedule_id
  JOIN public.events event
    ON event.id = s.event_id
  LEFT JOIN public.ministry_roles role
    ON role.id = sa.role_id
  WHERE sa.id = p_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment nao encontrado para notificacao.';
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, data)
  VALUES (
    v_assignment.user_id,
    'Nova escala',
    format(
      'Voce foi escalado para %s em %s.',
      v_assignment.role_name,
      v_assignment.event_title
    ),
    'schedule',
    jsonb_build_object(
      'action', 'assigned',
      'schedule_id', v_assignment.schedule_id,
      'event_id', v_assignment.event_id,
      'ministry_id', v_assignment.ministry_id,
      'assignment_id', v_assignment.id,
      'role_id', v_assignment.role_id
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_schedule_assignment_created_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.user_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.notify_schedule_assignment_created(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS schedule_assignments_notify_created ON public.schedule_assignments;

CREATE TRIGGER schedule_assignments_notify_created
  AFTER INSERT ON public.schedule_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_schedule_assignment_created_trigger();
