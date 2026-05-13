CREATE OR REPLACE FUNCTION public.prevent_unauthorized_event_permission_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.can_manage_events IS DISTINCT FROM OLD.can_manage_events
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar a permissao de eventos.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_unauthorized_event_permission_profile_update
  ON public.profiles;

CREATE TRIGGER prevent_unauthorized_event_permission_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_unauthorized_event_permission_profile_update();

DROP FUNCTION IF EXISTS public.set_profile_event_management_permission(UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.set_profile_event_management_permission(
  p_user_id UUID,
  p_can_manage_events BOOLEAN
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar esta permissao.';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario alvo invalido.';
  END IF;

  IF p_can_manage_events IS NULL THEN
    RAISE EXCEPTION 'Valor de permissao invalido.';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Administradores nao precisam alterar a propria permissao.';
  END IF;

  UPDATE public.profiles
  SET can_manage_events = p_can_manage_events,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING *
  INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil nao encontrado.';
  END IF;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_event_management_permission(UUID, BOOLEAN)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.set_profile_event_management_permission(UUID, BOOLEAN)
  TO authenticated;
