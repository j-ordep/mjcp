-- Run on a disposable local database with all migrations applied, as postgres.
-- Fictional fixtures only. All changes, including the test helpers, are rolled back.
BEGIN;

CREATE FUNCTION pg_temp.test_id(value integer) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT ('00000000-0000-4000-8000-' || lpad(value::text, 12, '0'))::uuid;
$$;
CREATE TEMP TABLE authorization_checks (label text, passed boolean);
GRANT ALL ON authorization_checks TO authenticated, anon;

CREATE FUNCTION pg_temp.check_true(label text, passed boolean) RETURNS void
LANGUAGE sql AS $$
  INSERT INTO authorization_checks VALUES (label, COALESCE(passed, false));
$$;

CREATE FUNCTION pg_temp.check_denied(label text, statement text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  denied boolean := false;
BEGIN
  BEGIN
    EXECUTE statement;
    -- Roll back even an unexpectedly successful write, keeping the other tests independent.
    RAISE SQLSTATE 'ZX001' USING MESSAGE = 'Rollback test write';
  EXCEPTION
    WHEN SQLSTATE 'ZX001' THEN NULL;
    WHEN insufficient_privilege OR raise_exception THEN denied := true;
  END;
  PERFORM pg_temp.check_true(label, denied);
END;
$$;

-- Users: 1 admin, 2 member, 3 eligible replacement, 4 local leader, 5 other leader, 6 event manager.
SELECT set_config('request.jwt.claim.sub', '', true);
INSERT INTO auth.users (id, email, raw_user_meta_data)
SELECT pg_temp.test_id(n), 'fixture-' || n || '@example.com', '{"full_name":"Pessoa ficticia"}'::jsonb
FROM generate_series(1, 6) AS n;
UPDATE public.profiles SET role = 'admin' WHERE id = pg_temp.test_id(1);
UPDATE public.profiles SET can_manage_events = true WHERE id = pg_temp.test_id(6);

INSERT INTO public.ministries (id, name) VALUES
  (pg_temp.test_id(10), 'Ministerio de teste'), (pg_temp.test_id(11), 'Outro ministerio');
INSERT INTO public.ministry_roles (id, ministry_id, name) VALUES
  (pg_temp.test_id(20), pg_temp.test_id(10), 'Funcao A'),
  (pg_temp.test_id(21), pg_temp.test_id(10), 'Funcao B'),
  (pg_temp.test_id(22), pg_temp.test_id(11), 'Outra funcao');
INSERT INTO public.ministry_members (id, ministry_id, user_id, is_leader) VALUES
  (pg_temp.test_id(30), pg_temp.test_id(10), pg_temp.test_id(2), false),
  (pg_temp.test_id(31), pg_temp.test_id(10), pg_temp.test_id(3), false),
  (pg_temp.test_id(32), pg_temp.test_id(10), pg_temp.test_id(4), true),
  (pg_temp.test_id(33), pg_temp.test_id(11), pg_temp.test_id(5), true);
INSERT INTO public.ministry_member_roles (member_id, role_id) VALUES
  (pg_temp.test_id(30), pg_temp.test_id(20)), (pg_temp.test_id(31), pg_temp.test_id(20));

-- now() is fixed for this transaction, so event 41 tests the exact time boundary.
INSERT INTO public.events (id, title, start_at, end_at) VALUES
  (pg_temp.test_id(40), 'Evento futuro', now() + interval '1 day', now() + interval '1 day 3 hours'),
  (pg_temp.test_id(41), 'Evento no limite', now(), now() + interval '3 hours'),
  (pg_temp.test_id(42), 'Evento passado', now() - interval '1 day', now() - interval '21 hours'),
  (pg_temp.test_id(43), 'Outro evento futuro', now() + interval '2 days', now() + interval '2 days 3 hours');
INSERT INTO public.schedules (id, event_id, ministry_id) VALUES
  (pg_temp.test_id(50), pg_temp.test_id(40), pg_temp.test_id(10)),
  (pg_temp.test_id(51), pg_temp.test_id(41), pg_temp.test_id(10)),
  (pg_temp.test_id(52), pg_temp.test_id(42), pg_temp.test_id(10)),
  (pg_temp.test_id(53), pg_temp.test_id(43), pg_temp.test_id(10));
INSERT INTO public.schedule_assignments (id, schedule_id, user_id, role_id) VALUES
  (pg_temp.test_id(60), pg_temp.test_id(50), pg_temp.test_id(2), pg_temp.test_id(20)),
  (pg_temp.test_id(61), pg_temp.test_id(51), pg_temp.test_id(2), pg_temp.test_id(20)),
  (pg_temp.test_id(62), pg_temp.test_id(52), pg_temp.test_id(2), pg_temp.test_id(20));
INSERT INTO public.songs (id, title) VALUES
  (pg_temp.test_id(80), 'Musica ficticia A'), (pg_temp.test_id(81), 'Musica ficticia B'),
  (pg_temp.test_id(82), 'Musica usada somente no futuro');
INSERT INTO public.event_setlists (event_id, song_id, position, song_key) VALUES
  (pg_temp.test_id(40), pg_temp.test_id(80), 1, 'F'),
  (pg_temp.test_id(41), pg_temp.test_id(80), 1, 'F'),
  (pg_temp.test_id(42), pg_temp.test_id(80), 1, 'F'),
  (pg_temp.test_id(43), pg_temp.test_id(82), 1, 'G');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', pg_temp.test_id(2)::text, true);
UPDATE public.profiles SET full_name = 'Nome atualizado', phone = '00000000000', avatar_url = null
WHERE id = auth.uid();
SELECT pg_temp.check_true('Member edits personal profile',
  (SELECT full_name = 'Nome atualizado' FROM public.profiles WHERE id = auth.uid()));
SELECT pg_temp.check_denied('Member cannot become admin',
  'UPDATE public.profiles SET role = ''admin'' WHERE id = auth.uid()');
SELECT pg_temp.check_denied('Member cannot grant event management',
  'UPDATE public.profiles SET can_manage_events = true WHERE id = auth.uid()');
SELECT pg_temp.check_denied('Member cannot rewrite profile creation time',
  'UPDATE public.profiles SET created_at = now() - interval ''1 year'' WHERE id = auth.uid()');

UPDATE public.schedule_assignments SET status = 'confirmed', confirmed_at = now()
WHERE id = pg_temp.test_id(60);
SELECT pg_temp.check_true('Member confirms own future assignment',
  (SELECT status = 'confirmed' AND confirmed_at IS NOT NULL FROM public.schedule_assignments WHERE id = pg_temp.test_id(60)));
SELECT pg_temp.check_denied('Member cannot change assignment role',
  'UPDATE public.schedule_assignments SET role_id = pg_temp.test_id(21) WHERE id = pg_temp.test_id(60)');
SELECT pg_temp.check_denied('Member cannot move assignment to another schedule',
  'UPDATE public.schedule_assignments SET schedule_id = pg_temp.test_id(53) WHERE id = pg_temp.test_id(60)');
SELECT pg_temp.check_denied('Member cannot rewrite assignment creation time',
  'UPDATE public.schedule_assignments SET created_at = now() - interval ''1 year'' WHERE id = pg_temp.test_id(60)');
SELECT pg_temp.check_denied('Member cannot set legacy swapped state directly',
  'UPDATE public.schedule_assignments SET status = ''swapped'' WHERE id = pg_temp.test_id(60)');
UPDATE public.schedule_assignments SET status = 'confirmed', confirmed_at = now()
WHERE id IN (pg_temp.test_id(61), pg_temp.test_id(62));
SELECT pg_temp.check_true('Confirmation blocks at start and in history',
  (SELECT bool_and(status = 'pending') FROM public.schedule_assignments WHERE id IN (pg_temp.test_id(61), pg_temp.test_id(62))));

INSERT INTO public.swap_requests (id, from_assignment_id) VALUES (pg_temp.test_id(90), pg_temp.test_id(60));
SELECT pg_temp.check_true('Opening swap resets confirmation',
  (SELECT status = 'pending' AND confirmed_at IS NULL FROM public.schedule_assignments WHERE id = pg_temp.test_id(60)));
SELECT public.cancel_own_swap_request(pg_temp.test_id(90));
SELECT pg_temp.check_true('Owner cancels own swap',
  (SELECT status = 'cancelled' FROM public.swap_requests WHERE id = pg_temp.test_id(90)));
INSERT INTO public.swap_requests (id, from_assignment_id) VALUES (pg_temp.test_id(91), pg_temp.test_id(60));

SELECT set_config('request.jwt.claim.sub', pg_temp.test_id(3)::text, true);
SELECT public.accept_swap_request(pg_temp.test_id(91));
SELECT pg_temp.check_true('Eligible member accepts via RPC',
  (SELECT user_id = auth.uid() AND status = 'pending' AND confirmed_at IS NULL
   FROM public.schedule_assignments WHERE id = pg_temp.test_id(60)));
UPDATE public.schedule_assignments SET status = 'confirmed', confirmed_at = now() WHERE id = pg_temp.test_id(60);
SELECT pg_temp.check_true('New owner can confirm after swap',
  (SELECT status = 'confirmed' FROM public.schedule_assignments WHERE id = pg_temp.test_id(60)));

SELECT set_config('request.jwt.claim.sub', pg_temp.test_id(4)::text, true);
UPDATE public.schedule_assignments SET role_id = pg_temp.test_id(21) WHERE id = pg_temp.test_id(60);
SELECT pg_temp.check_true('Local leader manages assignment role',
  (SELECT role_id = pg_temp.test_id(21) FROM public.schedule_assignments WHERE id = pg_temp.test_id(60)));
UPDATE public.schedule_assignments SET role_id = pg_temp.test_id(20) WHERE id = pg_temp.test_id(60);
SELECT set_config('request.jwt.claim.sub', pg_temp.test_id(5)::text, true);
UPDATE public.schedule_assignments SET role_id = pg_temp.test_id(21) WHERE id = pg_temp.test_id(60);
RESET ROLE;
SELECT pg_temp.check_true('Other ministry leader cannot edit assignment',
  (SELECT role_id = pg_temp.test_id(20) FROM public.schedule_assignments WHERE id = pg_temp.test_id(60)));

SELECT set_config('request.jwt.claim.sub', '', true);
UPDATE public.profiles SET role = 'leader' WHERE id = pg_temp.test_id(2);
SELECT pg_temp.check_true('Trusted maintenance can manage roles',
  (SELECT role = 'leader' FROM public.profiles WHERE id = pg_temp.test_id(2)));
UPDATE public.profiles SET role = 'member' WHERE id = pg_temp.test_id(2);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', pg_temp.test_id(1)::text, true);
SELECT public.set_profile_event_management_permission(pg_temp.test_id(2), true);
SELECT pg_temp.check_true('Admin permission RPC still works',
  (SELECT can_manage_events FROM public.profiles WHERE id = pg_temp.test_id(2)));
SELECT public.set_profile_event_management_permission(pg_temp.test_id(2), false);

SELECT set_config('request.jwt.claim.sub', pg_temp.test_id(2)::text, true);
SELECT pg_temp.check_denied('Member cannot replace setlist',
  'SELECT public.replace_event_setlist(pg_temp.test_id(40), ''[]''::jsonb)');
SELECT set_config('request.jwt.claim.sub', pg_temp.test_id(6)::text, true);
SELECT public.replace_event_setlist(pg_temp.test_id(40),
  jsonb_build_array(jsonb_build_object('song_id', pg_temp.test_id(81), 'song_key', ' G ')));
SELECT pg_temp.check_true('Event manager replaces future setlist atomically',
  (SELECT count(*) = 1 AND bool_and(song_id = pg_temp.test_id(81) AND song_key = 'G')
   FROM public.event_setlists WHERE event_id = pg_temp.test_id(40)));
SELECT public.replace_event_setlist(pg_temp.test_id(40), '[]'::jsonb);
SELECT pg_temp.check_true('Event manager clears future setlist',
  NOT EXISTS (SELECT 1 FROM public.event_setlists WHERE event_id = pg_temp.test_id(40)));
SELECT pg_temp.check_denied('Setlist RPC blocks exactly at event start',
  'SELECT public.replace_event_setlist(pg_temp.test_id(41), ''[]''::jsonb)');
SELECT pg_temp.check_denied('Setlist RPC blocks in history',
  'SELECT public.replace_event_setlist(pg_temp.test_id(42), ''[]''::jsonb)');
SELECT pg_temp.check_denied('Direct setlist insertion blocks in history',
  'INSERT INTO public.event_setlists (event_id, song_id, position) VALUES (pg_temp.test_id(42), pg_temp.test_id(81), 2)');
UPDATE public.event_setlists SET song_key = 'C' WHERE event_id = pg_temp.test_id(41);
DELETE FROM public.event_setlists WHERE event_id = pg_temp.test_id(42);
SELECT pg_temp.check_true('Direct setlist update blocks at start',
  (SELECT song_key = 'F' FROM public.event_setlists WHERE event_id = pg_temp.test_id(41)));
SELECT pg_temp.check_true('Direct setlist deletion preserves history',
  (SELECT count(*) = 1 FROM public.event_setlists WHERE event_id = pg_temp.test_id(42)));
SELECT pg_temp.check_true('Historical setlist remains readable',
  (SELECT count(*) = 2 FROM public.event_setlists WHERE event_id IN (pg_temp.test_id(41), pg_temp.test_id(42))));

SELECT set_config('request.jwt.claim.sub', pg_temp.test_id(1)::text, true);
SELECT pg_temp.check_denied('Deleting catalog song cannot cascade into historical setlists',
  'DELETE FROM public.songs WHERE id = pg_temp.test_id(80)');
DELETE FROM public.songs WHERE id = pg_temp.test_id(82);
SELECT pg_temp.check_true('Deleting future-only song still cascades normally',
  NOT EXISTS (SELECT 1 FROM public.songs WHERE id = pg_temp.test_id(82))
  AND NOT EXISTS (SELECT 1 FROM public.event_setlists WHERE event_id = pg_temp.test_id(43)));

RESET ROLE;
SELECT label, passed FROM authorization_checks ORDER BY label;
DO $$
DECLARE failures text;
BEGIN
  SELECT string_agg(label, '; ') INTO failures FROM authorization_checks WHERE NOT passed;
  IF failures IS NOT NULL THEN RAISE EXCEPTION 'Authorization failures: %', failures; END IF;
END;
$$;
ROLLBACK;
