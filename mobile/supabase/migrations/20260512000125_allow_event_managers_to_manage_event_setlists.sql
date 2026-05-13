DROP POLICY IF EXISTS "Admin can manage event setlists" ON public.event_setlists;
DROP POLICY IF EXISTS "Event managers can manage event setlists" ON public.event_setlists;

CREATE POLICY "Event managers can manage event setlists"
  ON public.event_setlists
  FOR ALL
  USING (public.can_manage_events())
  WITH CHECK (public.can_manage_events());
