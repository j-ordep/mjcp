-- Migration: 006 - Create schedules table
-- A ministry's schedule block within a specific event

CREATE TABLE public.schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, ministry_id)
);
