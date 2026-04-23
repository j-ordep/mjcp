-- Members may only confirm/update their own assignments before the event day.
-- Administrative edits continue to be governed by admin/leader policies.

DROP POLICY IF EXISTS "Users can update own assignment status" ON public.schedule_assignments;

CREATE POLICY "Users can update own assignment status before event day"
  ON public.schedule_assignments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.events e
        ON e.id = s.event_id
      WHERE s.id = schedule_assignments.schedule_id
        AND e.start_at::date > current_date
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.schedules s
      JOIN public.events e
        ON e.id = s.event_id
      WHERE s.id = schedule_assignments.schedule_id
        AND e.start_at::date > current_date
    )
  );

