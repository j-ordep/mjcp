-- When a member opens a swap request for their own assignment,
-- the assignment must return to pending immediately.
-- The database keeps the canonical rule so the app cannot bypass it.

CREATE OR REPLACE FUNCTION public.reset_assignment_confirmation_on_swap_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.schedule_assignments
  SET status = 'pending',
      confirmed_at = NULL
  WHERE id = NEW.from_assignment_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS swap_requests_reset_assignment_confirmation ON public.swap_requests;

CREATE TRIGGER swap_requests_reset_assignment_confirmation
  AFTER INSERT ON public.swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_assignment_confirmation_on_swap_request();
