CREATE TABLE "character" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"appearance_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_user_id" text NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"week_ending" timestamp with time zone NOT NULL,
	"stories_created" integer DEFAULT 0 NOT NULL,
	"total_words_written" integer DEFAULT 0 NOT NULL,
	"vocabulary_highlights" jsonb,
	"moderation_incidents" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_page_id" uuid NOT NULL,
	"url" text NOT NULL,
	"scene_hash" text NOT NULL,
	"model_used" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_image_scene_hash_unique" UNIQUE("scene_hash")
);
--> statement-breakpoint
ALTER TABLE "character" ADD CONSTRAINT "character_child_profile_id_child_profile_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_report" ADD CONSTRAINT "parent_report_parent_user_id_user_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_report" ADD CONSTRAINT "parent_report_child_profile_id_child_profile_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_image" ADD CONSTRAINT "story_image_story_page_id_story_page_id_fk" FOREIGN KEY ("story_page_id") REFERENCES "public"."story_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "character_child_profile_id_idx" ON "character" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "parent_report_parent_child_week_idx" ON "parent_report" USING btree ("parent_user_id","child_profile_id","week_ending");--> statement-breakpoint
CREATE INDEX "story_image_scene_hash_idx" ON "story_image" USING btree ("scene_hash");