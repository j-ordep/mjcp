-- Temporary read access for the mobile monthly preview. No schedule writes or workflows.
GRANT SELECT ON public.ministry_members, public.ministries TO authenticated;

CREATE POLICY ministry_members_read_self ON public.ministry_members
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY ministries_read_member_or_admin ON public.ministries
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT ministry_id FROM public.ministry_members
      WHERE user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (SELECT auth.uid()) AND access_role = 'admin'
    )
  );
