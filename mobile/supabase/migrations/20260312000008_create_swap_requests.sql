-- Migration: 008 - Create swap_requests table
-- Allows members to request assignment swaps with other members

CREATE TABLE public.swap_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_assignment_id UUID NOT NULL REFERENCES schedule_assignments(id) ON DELETE CASCADE,
  to_assignment_id   UUID REFERENCES schedule_assignments(id) ON DELETE SET NULL,
  to_user_id         UUID REFERENCES profiles(id),  -- target user (optional)
  reason             TEXT,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by        UUID REFERENCES profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER swap_requests_updated_at
  BEFORE UPDATE ON public.swap_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
