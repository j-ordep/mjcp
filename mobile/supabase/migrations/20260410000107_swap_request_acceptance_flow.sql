-- Swap flow: eligible members can view pending requests,
-- requester can cancel own request, and the first eligible member can accept.

DROP POLICY IF EXISTS "Leaders can view swap requests for own ministries" ON public.swap_requests;
DROP POLICY IF EXISTS "Leaders can update swap requests for own ministries" ON public.swap_requests;

CREATE UNIQUE INDEX IF NOT EXISTS swap_requests_one_pending_per_assignment_idx
  ON public.swap_requests (from_assignment_id)
  WHERE status = 'pending';

CREATE POLICY "Eligible users can view pending swap requests"
  ON public.swap_requests
  FOR SELECT
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.schedule_assignments sa
      JOIN public.schedules s
        ON s.id = sa.schedule_id
      JOIN public.ministry_members mm
        ON mm.ministry_id = s.ministry_id
       AND mm.user_id = auth.uid()
      JOIN public.ministry_member_roles mmr
        ON mmr.member_id = mm.id
       AND mmr.role_id = sa.role_id
      WHERE sa.id = swap_requests.from_assignment_id
        AND sa.user_id <> auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.accept_swap_request(p_swap_request_id UUID)
RETURNS public.swap_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.swap_requests%ROWTYPE;
  v_assignment RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  SELECT *
  INTO v_request
  FROM public.swap_requests
  WHERE id = p_swap_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao de troca nao encontrada.';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Esta solicitacao ja foi processada.';
  END IF;

  SELECT sa.*, s.ministry_id
  INTO v_assignment
  FROM public.schedule_assignments sa
  JOIN public.schedules s
    ON s.id = sa.schedule_id
  WHERE sa.id = v_request.from_assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment de origem nao encontrado.';
  END IF;

  IF v_assignment.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Voce nao pode aceitar a propria solicitacao.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.ministry_members mm
    JOIN public.ministry_member_roles mmr
      ON mmr.member_id = mm.id
     AND mmr.role_id = v_assignment.role_id
    WHERE mm.user_id = auth.uid()
      AND mm.ministry_id = v_assignment.ministry_id
  ) THEN
    RAISE EXCEPTION 'Voce nao e elegivel para esta troca.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.schedule_assignments sa
    WHERE sa.schedule_id = v_assignment.schedule_id
      AND sa.user_id = auth.uid()
      AND sa.role_id = v_assignment.role_id
      AND sa.id <> v_assignment.id
  ) THEN
    RAISE EXCEPTION 'Voce ja esta escalado nesta mesma funcao.';
  END IF;

  UPDATE public.swap_requests
  SET status = 'approved',
      to_user_id = auth.uid(),
      updated_at = now()
  WHERE id = v_request.id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Esta solicitacao ja foi aceita por outra pessoa.';
  END IF;

  UPDATE public.schedule_assignments
  SET user_id = auth.uid(),
      status = 'pending',
      confirmed_at = NULL
  WHERE id = v_assignment.id;

  UPDATE public.swap_requests
  SET status = 'cancelled',
      updated_at = now()
  WHERE from_assignment_id = v_assignment.id
    AND id <> v_request.id
    AND status = 'pending';

  RETURN (
    SELECT sr
    FROM public.swap_requests sr
    WHERE sr.id = v_request.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_own_swap_request(p_swap_request_id UUID)
RETURNS public.swap_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.swap_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado.';
  END IF;

  SELECT sr.*
  INTO v_request
  FROM public.swap_requests sr
  JOIN public.schedule_assignments sa
    ON sa.id = sr.from_assignment_id
  WHERE sr.id = p_swap_request_id
    AND sa.user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitacao nao encontrada.';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Somente solicitacoes pendentes podem ser canceladas.';
  END IF;

  UPDATE public.swap_requests
  SET status = 'cancelled',
      updated_at = now()
  WHERE id = v_request.id;

  RETURN (
    SELECT sr
    FROM public.swap_requests sr
    WHERE sr.id = v_request.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_swap_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_own_swap_request(UUID) TO authenticated;
