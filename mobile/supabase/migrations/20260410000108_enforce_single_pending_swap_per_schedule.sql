-- Enforce swap creation rules:
-- - requester may cancel own pending request
-- - requester cannot create a second pending request for the same schedule

CREATE OR REPLACE FUNCTION public.validate_swap_request_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment public.schedule_assignments%ROWTYPE;
  v_schedule_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  SELECT sa.*
  INTO v_assignment
  FROM public.schedule_assignments sa
  WHERE sa.id = NEW.from_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment de origem nao encontrado.';
  END IF;

  IF v_assignment.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Voce so pode solicitar troca para o proprio assignment.';
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

DROP TRIGGER IF EXISTS swap_requests_validate_creation ON public.swap_requests;

CREATE TRIGGER swap_requests_validate_creation
  BEFORE INSERT ON public.swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_swap_request_creation();
