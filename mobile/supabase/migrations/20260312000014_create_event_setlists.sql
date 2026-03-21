-- Migration: 014 - Create event_setlists table
-- Links songs to events with ordering and optional key override

CREATE TABLE public.event_setlists (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  song_id  UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,  -- order in setlist
  song_key TEXT,                    -- key override for this specific event
  UNIQUE(event_id, song_id)
);
