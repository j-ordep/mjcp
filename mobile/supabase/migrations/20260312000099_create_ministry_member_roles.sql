-- Migration: 004b - Create ministry_member_roles table
-- Capabilities: which roles a member knows how to perform in a ministry
-- This is separate from schedule_assignments, which tracks the actual assignment per event

CREATE TABLE public.ministry_member_roles (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES ministry_members(id) ON DELETE CASCADE,
  role_id   UUID NOT NULL REFERENCES ministry_roles(id) ON DELETE CASCADE,
  UNIQUE(member_id, role_id)
);
