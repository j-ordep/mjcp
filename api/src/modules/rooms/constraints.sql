-- Protect active room reservations against overlapping inserts and updates.
-- Adjacent intervals are allowed; cancelled reservations do not occupy time.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE public.room_reservations
  ADD CONSTRAINT room_reservations_no_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status = 'active');
