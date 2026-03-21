-- Migration: 010 - Create rooms table
-- Physical rooms/spaces available for reservation

CREATE TABLE public.rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  capacity    INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
