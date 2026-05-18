-- Break residual RLS recursion between `events` and `schedules`.
-- Product decision already validated in app/docs:
-- events are informative and should not vary by assignment, ministry or participation.
-- Therefore event read access must not depend on `schedules`.

DROP POLICY IF EXISTS "Public events readable by all" ON public.events;

CREATE POLICY "Public events readable by all"
  ON public.events
  FOR SELECT
  USING (
    is_public = true
    OR auth.uid() IS NOT NULL
  );
