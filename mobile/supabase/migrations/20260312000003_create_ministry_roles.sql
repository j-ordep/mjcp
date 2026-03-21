-- Migration: 003 - Create ministry_roles table
-- Dynamic roles defined per ministry (e.g. Vocal, Guitar, Drums)

CREATE TABLE public.ministry_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,  -- e.g. "Vocal", "Guitar", "Drums"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ministry_id, name)
);
