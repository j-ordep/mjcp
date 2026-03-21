-- Migration: 013 - Create songs table
-- Song catalog for worship music management

CREATE TABLE public.songs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  artist     TEXT,
  key        TEXT,          -- musical key (e.g. "G", "Bb")
  bpm        INT,
  category   TEXT CHECK (category IN ('louvor', 'adoracao', 'infantil', 'outro')),
  lyrics_url TEXT,          -- link to chord/lyrics sheet
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
