-- Move member removal and profile directory reads behind explicit RPCs.
-- This preserves historical assignments and avoids exposing profile contact data
-- through the generic authenticated SELECT policy.

CREATE OR REPLACE FUNCTION public.remove_ministry_member_preserving_history(
  p_member_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member public.ministry_members%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  SELECT *
  INTO v_member
  FROM public.ministry_members
  WHERE id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro do ministerio nao encontrado.';
  END IF;

  IF NOT (
    public.is_admin()
    OR public.is_ministry_leader(v_member.ministry_id)
  ) THEN
    RAISE EXCEPTION 'Usuario sem permissao para remover membro deste ministerio.';
  END IF;

  DELETE FROM public.schedule_assignments
  WHERE id IN (
    SELECT sa.id
    FROM public.schedule_assignments sa
    JOIN public.schedules s
      ON s.id = sa.schedule_id
    JOIN public.events e
      ON e.id = s.event_id
    WHERE sa.user_id = v_member.user_id
      AND s.ministry_id = v_member.ministry_id
      AND e.start_at > now()
  );

  DELETE FROM public.ministry_members
  WHERE id = p_member_id;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_ministry_member_preserving_history(UUID)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.remove_ministry_member_preserving_history(UUID)
  TO authenticated;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all profiles"
  ON public.profiles;

CREATE POLICY "Users can view own profile and admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      id = auth.uid()
      OR public.is_admin()
    )
  );

DROP FUNCTION IF EXISTS public.search_visible_profiles(TEXT, INTEGER, INTEGER, TEXT[]);

CREATE OR REPLACE FUNCTION public.search_visible_profiles(
  p_query TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 31,
  p_offset INTEGER DEFAULT 0,
  p_excluded_roles TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_query TEXT := btrim(COALESCE(p_query, ''));
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 31), 1), 101);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_excluded_roles TEXT[] := COALESCE(p_excluded_roles, ARRAY[]::TEXT[]);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.role::TEXT
  FROM public.profiles p
  WHERE NOT (p.role = ANY(v_excluded_roles))
    AND (
      v_query = ''
      OR p.full_name ILIKE '%' || v_query || '%'
    )
  ORDER BY p.full_name ASC NULLS LAST, p.id ASC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.search_visible_profiles(TEXT, INTEGER, INTEGER, TEXT[])
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.search_visible_profiles(TEXT, INTEGER, INTEGER, TEXT[])
  TO authenticated;

DROP FUNCTION IF EXISTS public.get_visible_profiles_by_ids(UUID[]);

CREATE OR REPLACE FUNCTION public.get_visible_profiles_by_ids(
  p_user_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.role::TEXT
  FROM public.profiles p
  WHERE p.id = ANY(COALESCE(p_user_ids, ARRAY[]::UUID[]))
  ORDER BY array_position(p_user_ids, p.id), p.full_name ASC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.get_visible_profiles_by_ids(UUID[])
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_visible_profiles_by_ids(UUID[])
  TO authenticated;

DROP FUNCTION IF EXISTS public.list_profiles_for_event_permissions(TEXT, INTEGER, INTEGER, TEXT[]);

CREATE OR REPLACE FUNCTION public.list_profiles_for_event_permissions(
  p_query TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 31,
  p_offset INTEGER DEFAULT 0,
  p_excluded_roles TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT,
  can_manage_events BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_query TEXT := btrim(COALESCE(p_query, ''));
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 31), 1), 101);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_excluded_roles TEXT[] := COALESCE(p_excluded_roles, ARRAY[]::TEXT[]);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem listar permissoes de eventos.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.role::TEXT,
    p.can_manage_events
  FROM public.profiles p
  WHERE NOT (p.role = ANY(v_excluded_roles))
    AND (
      v_query = ''
      OR p.full_name ILIKE '%' || v_query || '%'
      OR p.email ILIKE '%' || v_query || '%'
    )
  ORDER BY p.full_name ASC NULLS LAST, p.id ASC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.list_profiles_for_event_permissions(TEXT, INTEGER, INTEGER, TEXT[])
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.list_profiles_for_event_permissions(TEXT, INTEGER, INTEGER, TEXT[])
  TO authenticated;
