-- Private events remain in the same events domain.
-- Audience membership is modeled in a small join table so visibility
-- can stay enforceable by RLS without storing free-form arrays in events.

CREATE TABLE IF NOT EXISTS public.event_audiences (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_audiences_user_id_idx
  ON public.event_audiences(user_id);

ALTER TABLE public.event_audiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and selected users can read event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Admins can insert event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Admins can update event audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Admins can delete event audiences" ON public.event_audiences;

CREATE POLICY "Admins and selected users can read event audiences"
  ON public.event_audiences
  FOR SELECT
  USING (
    is_admin() OR user_id = auth.uid()
  );

CREATE POLICY "Admins can insert event audiences"
  ON public.event_audiences
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update event audiences"
  ON public.event_audiences
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete event audiences"
  ON public.event_audiences
  FOR DELETE
  USING (is_admin());

DROP POLICY IF EXISTS "Public events readable by all" ON public.events;

CREATE POLICY "Public events readable by all"
  ON public.events
  FOR SELECT
  USING (
    is_public = true
    OR is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.event_audiences event_audience
      WHERE event_audience.event_id = events.id
        AND event_audience.user_id = auth.uid()
    )
  );
