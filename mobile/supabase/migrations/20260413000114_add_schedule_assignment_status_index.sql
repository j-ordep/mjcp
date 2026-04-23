-- Supports the most common member queries for participation, confirmation, and swaps.

CREATE INDEX IF NOT EXISTS schedule_assignments_user_status_idx
  ON public.schedule_assignments (user_id, status);
