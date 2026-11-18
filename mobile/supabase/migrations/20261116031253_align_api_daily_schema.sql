-- Align Supabase persistence with the API schema. Schedule business rules stay in TypeScript.

-- Preserve accounts, memberships and catalogs. The user authorized discarding old test events/schedules/swaps.
SET LOCAL search_path = public, extensions;
LOCK TABLE public.profiles, public.ministries, public.ministry_roles, public.ministry_members, public.ministry_member_roles, public.blocked_dates, public.rooms, public.room_reservations, public.songs, public.events, public.schedules, public.schedule_assignments, public.swap_requests, public.notifications, public.event_setlists, public.event_audiences IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE _keep_users ON COMMIT DROP AS
SELECT id, full_name, email, phone, avatar_url,
  CASE WHEN role = 'admin' THEN 'admin' ELSE 'member' END AS access_role, created_at, updated_at FROM public.profiles;
CREATE TEMP TABLE _keep_ministries ON COMMIT DROP AS SELECT * FROM public.ministries;
CREATE TEMP TABLE _keep_positions ON COMMIT DROP AS SELECT * FROM public.ministry_roles;
CREATE TEMP TABLE _keep_members ON COMMIT DROP AS SELECT * FROM public.ministry_members;
CREATE TEMP TABLE _keep_capabilities ON COMMIT DROP AS
SELECT c.id, c.member_id, c.role_id AS position_id, m.ministry_id
FROM public.ministry_member_roles c JOIN public.ministry_members m ON m.id = c.member_id;
CREATE TEMP TABLE _keep_blocked_dates ON COMMIT DROP AS SELECT * FROM public.blocked_dates;
CREATE TEMP TABLE _keep_rooms ON COMMIT DROP AS SELECT id, name, coalesce(capacity, 0) AS capacity, description, created_at FROM public.rooms;
CREATE TEMP TABLE _keep_reservations ON COMMIT DROP AS
SELECT id, room_id, reserved_by, start_at, end_at, purpose, category, status, created_at FROM public.room_reservations;
CREATE TEMP TABLE _keep_songs ON COMMIT DROP AS SELECT * FROM public.songs;

DROP TABLE public.profiles, public.ministries, public.ministry_roles, public.ministry_members, public.ministry_member_roles, public.blocked_dates, public.rooms, public.room_reservations, public.songs, public.events, public.schedules, public.schedule_assignments, public.swap_requests, public.notifications, public.event_setlists, public.event_audiences CASCADE;
DROP FUNCTION IF EXISTS public.accept_swap_request(p_swap_request_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_events() CASCADE;
DROP FUNCTION IF EXISTS public.cancel_own_swap_request(p_swap_request_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_events_with_audiences(p_events jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_visible_profiles_by_ids(p_user_ids uuid[]) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_event_editable_before_start(p_event_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_ministry_leader(p_ministry_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.list_profiles_for_event_permissions(p_query text, p_limit integer, p_offset integer, p_excluded_roles text[]) CASCADE;
DROP FUNCTION IF EXISTS public.notify_schedule_assignment_created(p_assignment_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.notify_schedule_assignment_created_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.notify_swap_request_accepted(p_swap_request_id uuid, p_actor_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.notify_swap_request_cancelled(p_swap_request_id uuid, p_actor_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.notify_swap_request_created(p_swap_request_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.notify_swap_request_created_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_duplicate_member_schedule_assignment() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_unauthorized_event_permission_profile_update() CASCADE;
DROP FUNCTION IF EXISTS public.remove_ministry_member_preserving_history(p_member_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.replace_event_setlist(p_event_id uuid, p_items jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.reset_assignment_confirmation_on_swap_request() CASCADE;
DROP FUNCTION IF EXISTS public.save_event_with_optional_room_reservation(p_event_id uuid, p_title text, p_category text, p_description text, p_location text, p_start_at timestamp with time zone, p_end_at timestamp with time zone, p_is_public boolean, p_visible_user_ids uuid[], p_room_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.search_visible_profiles(p_query text, p_limit integer, p_offset integer, p_excluded_roles text[]) CASCADE;
DROP FUNCTION IF EXISTS public.set_profile_event_management_permission(p_user_id uuid, p_can_manage_events boolean) CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.validate_swap_request_creation() CASCADE;

-- DDL exported from api/src/modules/**/schema.ts using drizzle-kit export.
CREATE TABLE "blocked_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_dates_user_date_unique" UNIQUE("user_id","date")
);

CREATE TABLE "ministries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#000000',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ministries_name_unique" UNIQUE("name")
);

CREATE TABLE "ministry_member_capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"ministry_id" uuid NOT NULL,
	CONSTRAINT "ministry_member_capabilities_member_position_unique" UNIQUE("member_id","position_id")
);

CREATE TABLE "ministry_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ministry_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_leader" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ministry_members_ministry_user_unique" UNIQUE("ministry_id","user_id"),
	CONSTRAINT "ministry_members_id_ministry_unique" UNIQUE("id","ministry_id")
);

CREATE TABLE "ministry_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ministry_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ministry_positions_ministry_name_unique" UNIQUE("ministry_id","name"),
	CONSTRAINT "ministry_positions_id_ministry_unique" UNIQUE("id","ministry_id")
);

CREATE TABLE "schedule_occurrence_setlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"song_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"singer_user_id" uuid,
	"song_key" text,
	CONSTRAINT "setlist_items_occurrence_song_unique" UNIQUE("occurrence_id","song_id"),
	CONSTRAINT "setlist_items_occurrence_position_unique" UNIQUE("occurrence_id","position"),
	CONSTRAINT "setlist_items_position_check" CHECK ("schedule_occurrence_setlist_items"."position" >= 0)
);

CREATE TABLE "song_singer_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" uuid NOT NULL,
	"singer_user_id" uuid NOT NULL,
	"preferred_key" text NOT NULL,
	CONSTRAINT "song_singer_preferences_song_singer_unique" UNIQUE("song_id","singer_user_id")
);

CREATE TABLE "songs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist" text,
	"key" text,
	"bpm" integer,
	"category" text,
	"lyrics_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "songs_category_check" CHECK ("songs"."category" IS NULL OR "songs"."category" IN ('louvor', 'adoracao', 'infantil', 'outro'))
);

CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"type" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_type_check" CHECK ("notifications"."type" IN ('schedule', 'swap_request', 'room', 'general'))
);

CREATE TABLE "room_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"reserved_by" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"purpose" text,
	"category" text DEFAULT 'geral' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_reservations_end_after_start" CHECK ("room_reservations"."end_at" > "room_reservations"."start_at"),
	CONSTRAINT "room_reservations_status_check" CHECK ("room_reservations"."status" IN ('active', 'cancelled')),
	CONSTRAINT "room_reservations_category_check" CHECK ("room_reservations"."category" IN ('geral', 'culto', 'ensino', 'jovens', 'oração', 'reunião', 'especial'))
);

CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"capacity" integer DEFAULT 0 NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_capacity_check" CHECK ("rooms"."capacity" >= 0)
);

CREATE TABLE "schedule_occurrence_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"ministry_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_occurrence_user_unique" UNIQUE("occurrence_id","user_id"),
	CONSTRAINT "assignments_id_occurrence_unique" UNIQUE("id","occurrence_id"),
	CONSTRAINT "assignments_status_check" CHECK ("schedule_occurrence_assignments"."status" IN ('pending', 'confirmed', 'declined', 'swapped'))
);

CREATE TABLE "schedule_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"ministry_id" uuid NOT NULL,
	"title" text,
	"date" date NOT NULL,
	"time" time(0),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "occurrences_id_ministry_unique" UNIQUE("id","ministry_id"),
	CONSTRAINT "occurrences_ministry_date_unique" UNIQUE("ministry_id","date"),
	CONSTRAINT "occurrences_time_check" CHECK ("schedule_occurrences"."time" IS NULL OR "schedule_occurrences"."time" < TIME '24:00')
);

CREATE TABLE "schedule_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ministry_id" uuid NOT NULL,
	"reference_month" date NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_plans_ministry_month_unique" UNIQUE("ministry_id","reference_month"),
	CONSTRAINT "schedule_plans_id_ministry_unique" UNIQUE("id","ministry_id"),
	CONSTRAINT "schedule_plans_month_first_day" CHECK (EXTRACT(DAY FROM "schedule_plans"."reference_month") = 1),
	CONSTRAINT "schedule_plans_status_check" CHECK ("schedule_plans"."status" IN ('draft', 'published')),
	CONSTRAINT "schedule_plans_publication_check" CHECK ((
        "schedule_plans"."status" = 'draft' AND "schedule_plans"."published_at" IS NULL
      ) OR (
        "schedule_plans"."status" = 'published' AND "schedule_plans"."published_at" IS NOT NULL
      ))
);

CREATE TABLE "swap_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"requester_user_id" uuid,
	"accepted_by_user_id" uuid,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "swap_requests_status_check" CHECK ("swap_requests"."status" IN ('pending', 'approved', 'rejected', 'cancelled')),
	CONSTRAINT "swap_requests_resolution_check" CHECK ((
        "swap_requests"."status" = 'pending'
        AND "swap_requests"."requester_user_id" IS NOT NULL
        AND "swap_requests"."accepted_by_user_id" IS NULL
        AND "swap_requests"."resolved_at" IS NULL
      ) OR (
        "swap_requests"."status" = 'approved'
        AND "swap_requests"."accepted_by_user_id" IS NOT NULL
        AND ("swap_requests"."requester_user_id" IS NULL OR "swap_requests"."accepted_by_user_id" <> "swap_requests"."requester_user_id")
        AND "swap_requests"."resolved_at" IS NOT NULL
      ) OR (
        "swap_requests"."status" IN ('cancelled', 'rejected')
        AND "swap_requests"."accepted_by_user_id" IS NULL
        AND "swap_requests"."resolved_at" IS NOT NULL
      ))
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text,
	"email" text,
	"phone" text,
	"avatar_url" text,
	"access_role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_access_role_check" CHECK ("users"."access_role" IN ('admin', 'member'))
);

ALTER TABLE "blocked_dates" ADD CONSTRAINT "blocked_dates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ministry_member_capabilities" ADD CONSTRAINT "capabilities_member_ministry_fk" FOREIGN KEY ("member_id","ministry_id") REFERENCES "public"."ministry_members"("id","ministry_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ministry_member_capabilities" ADD CONSTRAINT "capabilities_position_ministry_fk" FOREIGN KEY ("position_id","ministry_id") REFERENCES "public"."ministry_positions"("id","ministry_id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ministry_members" ADD CONSTRAINT "ministry_members_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ministry_members" ADD CONSTRAINT "ministry_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "ministry_positions" ADD CONSTRAINT "ministry_positions_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_occurrence_setlist_items" ADD CONSTRAINT "schedule_occurrence_setlist_items_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_occurrence_setlist_items" ADD CONSTRAINT "schedule_occurrence_setlist_items_singer_user_id_users_id_fk" FOREIGN KEY ("singer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_occurrence_setlist_items" ADD CONSTRAINT "setlist_items_occurrence_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."schedule_occurrences"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "song_singer_preferences" ADD CONSTRAINT "song_singer_preferences_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "song_singer_preferences" ADD CONSTRAINT "song_singer_preferences_singer_user_id_users_id_fk" FOREIGN KEY ("singer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "room_reservations" ADD CONSTRAINT "room_reservations_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "room_reservations" ADD CONSTRAINT "room_reservations_reserved_by_users_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_occurrence_assignments" ADD CONSTRAINT "schedule_occurrence_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_occurrence_assignments" ADD CONSTRAINT "assignments_occurrence_ministry_fk" FOREIGN KEY ("occurrence_id","ministry_id") REFERENCES "public"."schedule_occurrences"("id","ministry_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_occurrence_assignments" ADD CONSTRAINT "assignments_position_ministry_fk" FOREIGN KEY ("position_id","ministry_id") REFERENCES "public"."ministry_positions"("id","ministry_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_occurrences" ADD CONSTRAINT "schedule_occurrences_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_occurrences" ADD CONSTRAINT "occurrences_plan_ministry_fk" FOREIGN KEY ("plan_id","ministry_id") REFERENCES "public"."schedule_plans"("id","ministry_id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_plans" ADD CONSTRAINT "schedule_plans_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "schedule_plans" ADD CONSTRAINT "schedule_plans_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_assignment_occurrence_fk" FOREIGN KEY ("assignment_id","occurrence_id") REFERENCES "public"."schedule_occurrence_assignments"("id","occurrence_id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "ministry_member_capabilities_position_idx" ON "ministry_member_capabilities" USING btree ("position_id");
CREATE INDEX "ministry_members_user_idx" ON "ministry_members" USING btree ("user_id");
CREATE INDEX "song_singer_preferences_singer_idx" ON "song_singer_preferences" USING btree ("singer_user_id");
CREATE INDEX "notifications_user_read_created_idx" ON "notifications" USING btree ("user_id","read","created_at" DESC NULLS LAST);
CREATE INDEX "room_reservations_room_start_idx" ON "room_reservations" USING btree ("room_id","start_at");
CREATE INDEX "assignments_user_status_idx" ON "schedule_occurrence_assignments" USING btree ("user_id","status");
CREATE INDEX "schedule_plans_author_idx" ON "schedule_plans" USING btree ("created_by_user_id");
CREATE UNIQUE INDEX "swaps_one_pending_per_assignment" ON "swap_requests" USING btree ("assignment_id") WHERE "swap_requests"."status" = 'pending';
CREATE INDEX "swap_requests_requester_idx" ON "swap_requests" USING btree ("requester_user_id");
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));

-- Supabase-specific identity binding; the portable API schema does not depend on Auth.
ALTER TABLE public.users ADD CONSTRAINT users_auth_id_fk
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Restore identity and catalog rows with their original IDs. Monthly plans start empty.
INSERT INTO public.users(id, full_name, email, phone, avatar_url, access_role, created_at, updated_at)
SELECT id, full_name, email, phone, avatar_url, access_role, created_at, updated_at FROM pg_temp._keep_users;
INSERT INTO public.ministries(id, name, description, color, created_at)
SELECT id, name, description, color, created_at FROM pg_temp._keep_ministries;
INSERT INTO public.ministry_positions(id, ministry_id, name, created_at)
SELECT id, ministry_id, name, created_at FROM pg_temp._keep_positions;
INSERT INTO public.ministry_members(id, ministry_id, user_id, is_leader, joined_at)
SELECT id, ministry_id, user_id, is_leader, joined_at FROM pg_temp._keep_members;
INSERT INTO public.ministry_member_capabilities(id, member_id, position_id, ministry_id)
SELECT id, member_id, position_id, ministry_id FROM pg_temp._keep_capabilities;
INSERT INTO public.blocked_dates(id, user_id, date, reason, created_at)
SELECT id, user_id, date, reason, created_at FROM pg_temp._keep_blocked_dates;
INSERT INTO public.rooms(id, name, capacity, description, created_at)
SELECT id, name, capacity, description, created_at FROM pg_temp._keep_rooms;
INSERT INTO public.room_reservations(id, room_id, reserved_by, start_at, end_at, purpose, category, status, created_at)
SELECT id, room_id, reserved_by, start_at, end_at, purpose, category, status, created_at FROM pg_temp._keep_reservations;
INSERT INTO public.songs(id, title, artist, key, bpm, category, lyrics_url, created_at)
SELECT id, title, artist, key, bpm, category, lyrics_url, created_at FROM pg_temp._keep_songs;

-- Keep the existing API room-reservation exclusion constraint; no schedule business functions.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE public.room_reservations ADD CONSTRAINT room_reservations_no_overlap
  EXCLUDE USING gist(room_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&) WHERE (status = 'active');

-- The API owns new domain access. Direct client access stays closed while HTTP integration is pending.
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.blocked_dates FROM PUBLIC, anon, authenticated;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ministries FROM PUBLIC, anon, authenticated;
ALTER TABLE public.ministry_member_capabilities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ministry_member_capabilities FROM PUBLIC, anon, authenticated;
ALTER TABLE public.ministry_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ministry_members FROM PUBLIC, anon, authenticated;
ALTER TABLE public.ministry_positions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ministry_positions FROM PUBLIC, anon, authenticated;
ALTER TABLE public.schedule_occurrence_setlist_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.schedule_occurrence_setlist_items FROM PUBLIC, anon, authenticated;
ALTER TABLE public.song_singer_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.song_singer_preferences FROM PUBLIC, anon, authenticated;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.songs FROM PUBLIC, anon, authenticated;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
ALTER TABLE public.room_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.room_reservations FROM PUBLIC, anon, authenticated;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rooms FROM PUBLIC, anon, authenticated;
ALTER TABLE public.schedule_occurrence_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.schedule_occurrence_assignments FROM PUBLIC, anon, authenticated;
ALTER TABLE public.schedule_occurrences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.schedule_occurrences FROM PUBLIC, anon, authenticated;
ALTER TABLE public.schedule_plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.schedule_plans FROM PUBLIC, anon, authenticated;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.swap_requests FROM PUBLIC, anon, authenticated;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.users FROM PUBLIC, anon, authenticated;

-- Temporary login compatibility only: keep the existing mobile profile lookup working.
GRANT SELECT ON public.users TO authenticated;
CREATE POLICY users_read_self ON public.users FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE VIEW public.profiles WITH (security_invoker = true) AS
SELECT id, full_name, email, phone, avatar_url, access_role AS role,
  false AS can_manage_events, created_at, updated_at FROM public.users;
GRANT SELECT ON public.profiles TO authenticated;

-- Supabase Auth infrastructure only; no schedule rules run in this trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.users(id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'avatar_url');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
NOTIFY pgrst, 'reload schema';

