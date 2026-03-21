-- Migration: 004 - Create ministry_members table
-- Membership: user belongs to a ministry. Capabilities (roles) are in ministry_member_roles.

CREATE TABLE public.ministry_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_leader   BOOLEAN NOT NULL DEFAULT false,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ministry_id, user_id)
);
