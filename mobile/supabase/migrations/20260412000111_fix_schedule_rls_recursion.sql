-- Hotfix: 20260404000104 introduced indirect RLS recursion by using FOR ALL
-- on schedules and schedule_assignments editable policies.
-- This migration converts those policies to INSERT/UPDATE/DELETE only.

DROP POLICY IF EXISTS "Admin can manage editable schedules" ON public.schedules;
DROP POLICY IF EXISTS "Leaders can manage editable schedules" ON public.schedules;

CREATE POLICY "Admin can insert editable schedules"
  ON public.schedules
  FOR INSERT
  WITH CHECK (
    is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = schedules.event_id
        AND e.start_at::date >= current_date
    )
  );

CREATE POLICY "Admin can update editable schedules"
  ON public.schedules
  FOR UPDATE
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

CREATE POLICY "Admin can delete editable schedules"
  ON public.schedules
  FOR DELETE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = schedules.event_id
        AND e.start_at::date >= current_date
    )
  );

CREATE POLICY "Leaders can insert editable schedules"
  ON public.schedules
  FOR INSERT
  WITH CHECK (
    is_ministry_leader(ministry_id)
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = schedules.event_id
        AND e.start_at::date >= current_date
    )
  );

CREATE POLICY "Leaders can update editable schedules"
  ON public.schedules
  FOR UPDATE
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

CREATE POLICY "Leaders can delete editable schedules"
  ON public.schedules
  FOR DELETE
  USING (
    is_ministry_leader(ministry_id)
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = schedules.event_id
        AND e.start_at::date >= current_date
    )
  );

DROP POLICY IF EXISTS "Admin can manage editable assignments" ON public.schedule_assignments;
DROP POLICY IF EXISTS "Leaders can manage editable assignments" ON public.schedule_assignments;

CREATE POLICY "Admin can insert editable assignments"
  ON public.schedule_assignments
  FOR INSERT
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

CREATE POLICY "Admin can update editable assignments"
  ON public.schedule_assignments
  FOR UPDATE
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

CREATE POLICY "Admin can delete editable assignments"
  ON public.schedule_assignments
  FOR DELETE
  USING (
    is_admin()
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.events e ON e.id = s.event_id
      WHERE s.id = schedule_assignments.schedule_id
        AND e.start_at::date >= current_date
    )
  );

CREATE POLICY "Leaders can insert editable assignments"
  ON public.schedule_assignments
  FOR INSERT
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

CREATE POLICY "Leaders can update editable assignments"
  ON public.schedule_assignments
  FOR UPDATE
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

CREATE POLICY "Leaders can delete editable assignments"
  ON public.schedule_assignments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.events e ON e.id = s.event_id
      WHERE s.id = schedule_assignments.schedule_id
        AND is_ministry_leader(s.ministry_id)
        AND e.start_at::date >= current_date
    )
  );
