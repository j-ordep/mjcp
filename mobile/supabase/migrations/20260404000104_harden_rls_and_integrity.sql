-- Migration: 018 - Harden RLS and scheduling integrity rules
-- Decisions approved:
-- 1) Leader reads blocked dates only for members in ministries they lead
-- 2) Assignment integrity validated in DB (RLS WITH CHECK) + app/service
-- 3) Event/schedule editable until event date; blocked starting next day
-- 4) Cross-ministry time conflict remains warning-only (no DB hard block)
-- 5) No new business functions in DB

-- =========================
-- BLOCKED_DATES POLICIES
-- =========================
DROP POLICY IF EXISTS "Users manage own blocked dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Leaders and admin can view blocked dates" ON public.blocked_dates;

CREATE POLICY "Users manage own blocked dates"
  ON public.blocked_dates
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Leaders and admin can view blocked dates"
  ON public.blocked_dates
  FOR SELECT
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.ministry_members leader_mm
      JOIN public.ministry_members target_mm
        ON target_mm.ministry_id = leader_mm.ministry_id
      WHERE leader_mm.user_id = auth.uid()
        AND leader_mm.is_leader = true
        AND target_mm.user_id = blocked_dates.user_id
    )
  );

-- =========================
-- EVENTS POLICIES (ADMIN)
-- Editable until event date (inclusive).
-- Block update/delete starting next day.
-- =========================
DROP POLICY IF EXISTS "Admin can manage events" ON public.events;

CREATE POLICY "Admin can insert events"
  ON public.events
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update editable events"
  ON public.events
  FOR UPDATE
  USING (
    is_admin()
    AND start_at::date >= current_date
  )
  WITH CHECK (
    is_admin()
    AND start_at::date >= current_date
  );

CREATE POLICY "Admin can delete editable events"
  ON public.events
  FOR DELETE
  USING (
    is_admin()
    AND start_at::date >= current_date
  );

-- =========================
-- SCHEDULES POLICIES
-- Editable until event date (inclusive).
-- =========================
DROP POLICY IF EXISTS "Admin can manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Leaders can manage schedules" ON public.schedules;

CREATE POLICY "Admin can manage editable schedules"
  ON public.schedules
  FOR ALL
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = schedules.event_id
        AND e.start_at::date >= current_date
    )
  )
  WITH CHECK (
    is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = schedules.event_id
        AND e.start_at::date >= current_date
    )
  );

CREATE POLICY "Leaders can manage editable schedules"
  ON public.schedules
  FOR ALL
  USING (
    is_ministry_leader(ministry_id)
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = schedules.event_id
        AND e.start_at::date >= current_date
    )
  )
  WITH CHECK (
    is_ministry_leader(ministry_id)
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = schedules.event_id
        AND e.start_at::date >= current_date
    )
  );

-- =========================
-- SCHEDULE_ASSIGNMENTS POLICIES
-- Integrity checks:
-- - role_id must belong to same ministry as schedule
-- - user_id must be a member of schedule ministry
-- Editable until event date (inclusive).
-- =========================
DROP POLICY IF EXISTS "Admin can manage assignments" ON public.schedule_assignments;
DROP POLICY IF EXISTS "Leaders can manage assignments" ON public.schedule_assignments;

CREATE POLICY "Admin can manage editable assignments"
  ON public.schedule_assignments
  FOR ALL
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.events e ON e.id = s.event_id
      WHERE s.id = schedule_assignments.schedule_id
        AND e.start_at::date >= current_date
    )
  )
  WITH CHECK (
    is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.events e ON e.id = s.event_id
      WHERE s.id = schedule_assignments.schedule_id
        AND e.start_at::date >= current_date
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_roles mr ON mr.id = schedule_assignments.role_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mr.ministry_id = s.ministry_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_members mm ON mm.ministry_id = s.ministry_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mm.user_id = schedule_assignments.user_id
    )
  );

CREATE POLICY "Leaders can manage editable assignments"
  ON public.schedule_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.events e ON e.id = s.event_id
      WHERE s.id = schedule_assignments.schedule_id
        AND is_ministry_leader(s.ministry_id)
        AND e.start_at::date >= current_date
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.events e ON e.id = s.event_id
      WHERE s.id = schedule_assignments.schedule_id
        AND is_ministry_leader(s.ministry_id)
        AND e.start_at::date >= current_date
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_roles mr ON mr.id = schedule_assignments.role_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mr.ministry_id = s.ministry_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.ministry_members mm ON mm.ministry_id = s.ministry_id
      WHERE s.id = schedule_assignments.schedule_id
        AND mm.user_id = schedule_assignments.user_id
    )
  );
