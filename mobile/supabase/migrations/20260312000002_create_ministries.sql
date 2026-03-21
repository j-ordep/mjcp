-- Migration: 002 - Create ministries table

CREATE TABLE public.ministries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  color       TEXT DEFAULT '#000000',  -- UI color identifier
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
