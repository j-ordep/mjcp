-- Migration: 019 - Allow leaders to manage ministry members and capabilities of their own ministries

DROP POLICY IF EXISTS "Leaders can manage ministry members" ON public.ministry_members;
DROP POLICY IF EXISTS "Leaders can manage member roles" ON public.ministry_member_roles;

CREATE POLICY "Leaders can manage ministry members"
  ON public.ministry_members
  FOR ALL
  USING (
    is_admin()
    OR is_ministry_leader(ministry_id)
  )
  WITH CHECK (
    is_admin()
    OR is_ministry_leader(ministry_id)
  );

CREATE POLICY "Leaders can manage member roles"
  ON public.ministry_member_roles
  FOR ALL
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.ministry_members mm
      WHERE mm.id = ministry_member_roles.member_id
        AND is_ministry_leader(mm.ministry_id)
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.ministry_members mm
      WHERE mm.id = ministry_member_roles.member_id
        AND is_ministry_leader(mm.ministry_id)
    )
  );
