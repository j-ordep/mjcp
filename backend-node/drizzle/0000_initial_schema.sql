CREATE TABLE "blocked_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_dates_user_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "ministries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#000000',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ministries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ministry_member_capabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"ministry_id" uuid NOT NULL,
	CONSTRAINT "ministry_member_capabilities_member_position_unique" UNIQUE("member_id","position_id")
);
--> statement-breakpoint
CREATE TABLE "ministry_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ministry_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_leader" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ministry_members_ministry_user_unique" UNIQUE("ministry_id","user_id"),
	CONSTRAINT "ministry_members_id_ministry_unique" UNIQUE("id","ministry_id")
);
--> statement-breakpoint
CREATE TABLE "ministry_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ministry_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ministry_positions_ministry_name_unique" UNIQUE("ministry_id","name"),
	CONSTRAINT "ministry_positions_id_ministry_unique" UNIQUE("id","ministry_id")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "song_singer_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song_id" uuid NOT NULL,
	"singer_user_id" uuid NOT NULL,
	"preferred_key" text NOT NULL,
	CONSTRAINT "song_singer_preferences_song_singer_unique" UNIQUE("song_id","singer_user_id")
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"capacity" integer DEFAULT 0 NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_capacity_check" CHECK ("rooms"."capacity" >= 0)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "schedule_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"ministry_id" uuid NOT NULL,
	"title" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "occurrences_id_ministry_unique" UNIQUE("id","ministry_id"),
	CONSTRAINT "occurrences_ministry_start_unique" UNIQUE("ministry_id","start_at"),
	CONSTRAINT "occurrences_end_after_start" CHECK ("schedule_occurrences"."end_at" IS NULL OR "schedule_occurrences"."end_at" > "schedule_occurrences"."start_at")
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "blocked_dates" ADD CONSTRAINT "blocked_dates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_member_capabilities" ADD CONSTRAINT "capabilities_member_ministry_fk" FOREIGN KEY ("member_id","ministry_id") REFERENCES "public"."ministry_members"("id","ministry_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_member_capabilities" ADD CONSTRAINT "capabilities_position_ministry_fk" FOREIGN KEY ("position_id","ministry_id") REFERENCES "public"."ministry_positions"("id","ministry_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_members" ADD CONSTRAINT "ministry_members_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_members" ADD CONSTRAINT "ministry_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_positions" ADD CONSTRAINT "ministry_positions_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_occurrence_setlist_items" ADD CONSTRAINT "schedule_occurrence_setlist_items_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_occurrence_setlist_items" ADD CONSTRAINT "schedule_occurrence_setlist_items_singer_user_id_users_id_fk" FOREIGN KEY ("singer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_occurrence_setlist_items" ADD CONSTRAINT "setlist_items_occurrence_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."schedule_occurrences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_singer_preferences" ADD CONSTRAINT "song_singer_preferences_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_singer_preferences" ADD CONSTRAINT "song_singer_preferences_singer_user_id_users_id_fk" FOREIGN KEY ("singer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_reservations" ADD CONSTRAINT "room_reservations_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_reservations" ADD CONSTRAINT "room_reservations_reserved_by_users_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_occurrence_assignments" ADD CONSTRAINT "schedule_occurrence_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_occurrence_assignments" ADD CONSTRAINT "assignments_occurrence_ministry_fk" FOREIGN KEY ("occurrence_id","ministry_id") REFERENCES "public"."schedule_occurrences"("id","ministry_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_occurrence_assignments" ADD CONSTRAINT "assignments_position_ministry_fk" FOREIGN KEY ("position_id","ministry_id") REFERENCES "public"."ministry_positions"("id","ministry_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_occurrences" ADD CONSTRAINT "schedule_occurrences_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_occurrences" ADD CONSTRAINT "occurrences_plan_ministry_fk" FOREIGN KEY ("plan_id","ministry_id") REFERENCES "public"."schedule_plans"("id","ministry_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_plans" ADD CONSTRAINT "schedule_plans_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_plans" ADD CONSTRAINT "schedule_plans_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_assignment_occurrence_fk" FOREIGN KEY ("assignment_id","occurrence_id") REFERENCES "public"."schedule_occurrence_assignments"("id","occurrence_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ministry_member_capabilities_position_idx" ON "ministry_member_capabilities" USING btree ("position_id");--> statement-breakpoint
CREATE INDEX "ministry_members_user_idx" ON "ministry_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "song_singer_preferences_singer_idx" ON "song_singer_preferences" USING btree ("singer_user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_created_idx" ON "notifications" USING btree ("user_id","read","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "room_reservations_room_start_idx" ON "room_reservations" USING btree ("room_id","start_at");--> statement-breakpoint
CREATE INDEX "assignments_user_status_idx" ON "schedule_occurrence_assignments" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "schedule_plans_author_idx" ON "schedule_plans" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "swaps_one_pending_per_assignment" ON "swap_requests" USING btree ("assignment_id") WHERE "swap_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "swap_requests_requester_idx" ON "swap_requests" USING btree ("requester_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));