-- Enforce temporal integrity at the database boundary.
-- NOT VALID keeps the migration safe for existing production data while still
-- checking every new or updated row from this point forward.

ALTER TABLE public.events
  ADD CONSTRAINT events_end_after_start_check
  CHECK (end_at IS NULL OR end_at > start_at)
  NOT VALID;

ALTER TABLE public.room_reservations
  ADD CONSTRAINT room_reservations_end_after_start_check
  CHECK (end_at > start_at)
  NOT VALID;
