-- Migration: 015 - Enable RLS and create Row Level Security policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_setlists ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is leader of a specific ministry
CREATE OR REPLACE FUNCTION public.is_ministry_leader(p_ministry_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM ministry_members
    WHERE ministry_id = p_ministry_id AND user_id = auth.uid() AND is_leader = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

-- ────────────────────────────────────────────────────────
-- MINISTRIES
-- ────────────────────────────────────────────────────────

CREATE POLICY "Authenticated can read ministries"
  ON ministries FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage ministries"
  ON ministries FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- MINISTRY_ROLES
-- ────────────────────────────────────────────────────────

CREATE POLICY "Authenticated can read ministry roles"
  ON ministry_roles FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage ministry roles"
  ON ministry_roles FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- MINISTRY_MEMBERS
-- ────────────────────────────────────────────────────────

CREATE POLICY "Authenticated can read ministry members"
  ON ministry_members FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage ministry members"
  ON ministry_members FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- MINISTRY_MEMBER_ROLES
-- ────────────────────────────────────────────────────────

CREATE POLICY "Authenticated can read member roles"
  ON ministry_member_roles FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage member roles"
  ON ministry_member_roles FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- EVENTS
-- ────────────────────────────────────────────────────────

CREATE POLICY "Public events readable by all"
  ON events FOR SELECT USING (
    is_public = true OR is_admin() OR EXISTS (
      SELECT 1 FROM schedules s
      JOIN ministry_members mm ON mm.ministry_id = s.ministry_id
      WHERE s.event_id = events.id AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage events"
  ON events FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- SCHEDULES
-- ────────────────────────────────────────────────────────

CREATE POLICY "Ministry members can see schedules"
  ON schedules FOR SELECT USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM ministry_members
      WHERE ministry_id = schedules.ministry_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage schedules"
  ON schedules FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- SCHEDULE_ASSIGNMENTS
-- ────────────────────────────────────────────────────────

CREATE POLICY "Ministry members can see assignments"
  ON schedule_assignments FOR SELECT USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM schedules s
      JOIN ministry_members mm ON mm.ministry_id = s.ministry_id
      WHERE s.id = schedule_assignments.schedule_id AND mm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own assignment status"
  ON schedule_assignments FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage assignments"
  ON schedule_assignments FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- SWAP_REQUESTS
-- ────────────────────────────────────────────────────────

CREATE POLICY "Users can view own swap requests"
  ON swap_requests FOR SELECT USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM schedule_assignments sa
      WHERE sa.id = swap_requests.from_assignment_id AND sa.user_id = auth.uid()
    ) OR to_user_id = auth.uid()
  );

CREATE POLICY "Users can create swap requests"
  ON swap_requests FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM schedule_assignments sa
      WHERE sa.id = from_assignment_id AND sa.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage swap requests"
  ON swap_requests FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- BLOCKED_DATES
-- ────────────────────────────────────────────────────────

CREATE POLICY "Users manage own blocked dates"
  ON blocked_dates FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Leaders and admin can view blocked dates"
  ON blocked_dates FOR SELECT USING (is_admin());

-- ────────────────────────────────────────────────────────
-- ROOMS
-- ────────────────────────────────────────────────────────

CREATE POLICY "All authenticated can read rooms"
  ON rooms FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage rooms"
  ON rooms FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- ROOM_RESERVATIONS
-- ────────────────────────────────────────────────────────

CREATE POLICY "All authenticated can read reservations"
  ON room_reservations FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create own reservations"
  ON room_reservations FOR INSERT WITH CHECK (reserved_by = auth.uid());

CREATE POLICY "Users can cancel own reservations"
  ON room_reservations FOR UPDATE USING (reserved_by = auth.uid());

-- ────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ────────────────────────────────────────────────────────

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────
-- SONGS
-- ────────────────────────────────────────────────────────

CREATE POLICY "All authenticated can read songs"
  ON songs FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage songs"
  ON songs FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────
-- EVENT_SETLISTS
-- ────────────────────────────────────────────────────────

CREATE POLICY "Authenticated can read event setlists"
  ON event_setlists FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage event setlists"
  ON event_setlists FOR ALL USING (is_admin());
