-- Migration: 007 - Create schedule_assignments table
-- The actual assignment: member IS doing a specific role at a specific event
-- UNIQUE(schedule_id, user_id, role_id) allows multiple roles per member per schedule
-- (e.g. guitar + back vocal in the same service)

CREATE TABLE public.schedule_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id  UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id      UUID NOT NULL REFERENCES ministry_roles(id),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'swapped')),
  confirmed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(schedule_id, user_id, role_id)
);
