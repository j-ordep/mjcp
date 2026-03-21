-- Migration: 011 - Create room_reservations table
-- Uses GiST exclusion constraint to prevent double-booking of rooms
-- Requires the btree_gist extension

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE public.room_reservations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  reserved_by UUID NOT NULL REFERENCES profiles(id),
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  purpose     TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status = 'active')
);
