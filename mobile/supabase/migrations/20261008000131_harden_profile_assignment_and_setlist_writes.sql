-- Restrict self-service writes without changing confirmation, swaps or scoped management.

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin()
     AND (to_jsonb(NEW) - ARRAY['full_name', 'email', 'phone', 'avatar_url', 'updated_at'])
         IS DISTINCT FROM
         (to_jsonb(OLD) - ARRAY['full_name', 'email', 'phone', 'avatar_url', 'updated_at']) THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar campos privilegiados do perfil.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_unauthorized_event_permission_profile_update ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_unauthorized_event_permission_profile_update();
CREATE TRIGGER profiles_protect_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

CREATE OR REPLACE FUNCTION public.protect_assignment_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- RPCs and triggers run as their trusted owner. Their own authorization and time
  -- checks govern swaps and confirmation resets. Direct API writes run as authenticated.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() OR EXISTS (
    SELECT 1 FROM public.schedules s
    WHERE s.id = OLD.schedule_id AND public.is_ministry_leader(s.ministry_id)
  ) THEN
    RETURN NEW;
  END IF;

  IF OLD.user_id IS DISTINCT FROM auth.uid()
     OR (to_jsonb(NEW) - ARRAY['status', 'confirmed_at'])
         IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status', 'confirmed_at'])
     OR NEW.status NOT IN ('pending', 'confirmed', 'declined') THEN
    RAISE EXCEPTION 'Membros so podem atualizar a propria confirmacao de participacao.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER schedule_assignments_protect_member_update
  BEFORE UPDATE ON public.schedule_assignments
  FOR EACH ROW EXECUTE FUNCTION public.protect_assignment_member_update();

-- Keep the authenticated SELECT policy: historical repertories remain readable.
DROP POLICY IF EXISTS "Event managers can manage event setlists" ON public.event_setlists;
CREATE POLICY "Event managers can insert editable setlists"
  ON public.event_setlists FOR INSERT
  WITH CHECK (public.can_manage_events() AND public.is_event_editable_before_start(event_id));
CREATE POLICY "Event managers can update editable setlists"
  ON public.event_setlists FOR UPDATE
  USING (public.can_manage_events() AND public.is_event_editable_before_start(event_id))
  WITH CHECK (public.can_manage_events() AND public.is_event_editable_before_start(event_id));
CREATE POLICY "Event managers can delete editable setlists"
  ON public.event_setlists FOR DELETE
  USING (public.can_manage_events() AND public.is_event_editable_before_start(event_id));

-- Song deletion cascades into setlists without checking their RLS policies.
-- Keep that behavior for future events, but preserve started/historical repertories.
CREATE OR REPLACE FUNCTION public.protect_historical_setlist_songs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.event_setlists item
    JOIN public.events event ON event.id = item.event_id
    WHERE item.song_id = OLD.id AND event.start_at <= now()
  ) THEN
    RAISE EXCEPTION 'Nao e possivel excluir musica de repertorio de evento iniciado.'
      USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER songs_protect_historical_setlists
  BEFORE DELETE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION public.protect_historical_setlist_songs();

CREATE OR REPLACE FUNCTION public.replace_event_setlist(
  p_event_id UUID,
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items JSONB := COALESCE(p_items, '[]'::JSONB);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;
  IF NOT public.can_manage_events() THEN
    RAISE EXCEPTION 'Usuario sem permissao para atualizar a setlist.';
  END IF;
  IF p_event_id IS NULL THEN
    RAISE EXCEPTION 'Evento invalido.';
  END IF;
  IF jsonb_typeof(v_items) <> 'array' THEN
    RAISE EXCEPTION 'Setlist invalida.';
  END IF;

  -- Serialize with event edits/deletion before checking the time and replacing items.
  PERFORM 1 FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Evento nao encontrado.';
  END IF;
  IF NOT public.is_event_editable_before_start(p_event_id) THEN
    RAISE EXCEPTION 'Nao e mais possivel alterar o repertorio no horario do evento ou depois dele.';
  END IF;

  DELETE FROM public.event_setlists WHERE event_id = p_event_id;
  INSERT INTO public.event_setlists (event_id, song_id, position, song_key)
  SELECT p_event_id, (item.value->>'song_id')::UUID, item.ordinality::INT,
         NULLIF(btrim(item.value->>'song_key'), '')
  FROM jsonb_array_elements(v_items) WITH ORDINALITY AS item(value, ordinality);
END;
$$;

REVOKE ALL ON FUNCTION public.replace_event_setlist(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_event_setlist(UUID, JSONB) TO authenticated;
