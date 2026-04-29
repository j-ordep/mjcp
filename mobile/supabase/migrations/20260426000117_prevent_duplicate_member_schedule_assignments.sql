-- Prevent a member from being assigned more than once in the same schedule.
-- Existing duplicated historical data is left untouched; this blocks new writes.

CREATE INDEX IF NOT EXISTS schedule_assignments_schedule_user_idx
  ON public.schedule_assignments (schedule_id, user_id);

CREATE OR REPLACE FUNCTION public.prevent_duplicate_member_schedule_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.schedule_assignments sa
    WHERE sa.schedule_id = NEW.schedule_id
      AND sa.user_id = NEW.user_id
      AND sa.id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'Membro ja esta escalado nesta escala.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS schedule_assignments_prevent_duplicate_member
  ON public.schedule_assignments;

CREATE TRIGGER schedule_assignments_prevent_duplicate_member
  BEFORE INSERT OR UPDATE OF schedule_id, user_id
  ON public.schedule_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_member_schedule_assignment();
