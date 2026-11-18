ALTER TABLE "schedule_occurrences" DROP CONSTRAINT "occurrences_ministry_start_unique";--> statement-breakpoint
ALTER TABLE "schedule_occurrences" DROP CONSTRAINT "occurrences_end_after_start";--> statement-breakpoint
ALTER TABLE "schedule_occurrences" ADD COLUMN "date" date;--> statement-breakpoint
ALTER TABLE "schedule_occurrences" ADD COLUMN "time" time(0);--> statement-breakpoint
-- Preserve the church's civil date and informational local time when upgrading a populated API database.
UPDATE "schedule_occurrences" SET
  "date" = ("start_at" AT TIME ZONE 'America/Sao_Paulo')::date,
  "time" = date_trunc('minute', "start_at" AT TIME ZONE 'America/Sao_Paulo')::time(0);--> statement-breakpoint
ALTER TABLE "schedule_occurrences" ALTER COLUMN "date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_occurrences" DROP COLUMN "start_at";--> statement-breakpoint
ALTER TABLE "schedule_occurrences" DROP COLUMN "end_at";--> statement-breakpoint
ALTER TABLE "schedule_occurrences" ADD CONSTRAINT "occurrences_ministry_date_unique" UNIQUE("ministry_id","date");--> statement-breakpoint
ALTER TABLE "schedule_occurrences" ADD CONSTRAINT "occurrences_time_check" CHECK ("schedule_occurrences"."time" IS NULL OR "schedule_occurrences"."time" < TIME '24:00');
