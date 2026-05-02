CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
ALTER TABLE "moderation_event" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "moderation_event" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "moderation_event" ADD COLUMN "reviewer_notes" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "moderation_event" ADD CONSTRAINT "moderation_event_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "moderation_event_unreviewed_idx" ON "moderation_event" USING btree ("reviewed_by_human","created_at" desc);