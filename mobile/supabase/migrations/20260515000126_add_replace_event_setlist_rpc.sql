DROP FUNCTION IF EXISTS public.replace_event_setlist(UUID, JSONB);

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

  IF NOT EXISTS (
    SELECT 1
    FROM public.events
    WHERE id = p_event_id
  ) THEN
    RAISE EXCEPTION 'Evento nao encontrado.';
  END IF;

  DELETE FROM public.event_setlists
  WHERE event_id = p_event_id;

  INSERT INTO public.event_setlists (
    event_id,
    song_id,
    position,
    song_key
  )
  SELECT
    p_event_id,
    (item.value->>'song_id')::UUID,
    item.ordinality::INT,
    NULLIF(btrim(item.value->>'song_key'), '')
  FROM jsonb_array_elements(v_items) WITH ORDINALITY AS item(value, ordinality);
END;
$$;

REVOKE ALL ON FUNCTION public.replace_event_setlist(UUID, JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.replace_event_setlist(UUID, JSONB)
TO authenticated;
