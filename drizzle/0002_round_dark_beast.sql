CREATE TYPE "public"."content_strictness" AS ENUM('standard', 'strict');--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('blocked', 'sanitized', 'allowed');--> statement-breakpoint
CREATE TYPE "public"."moderation_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'safe', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."story_status" AS ENUM('draft', 'complete', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "child_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"age" integer NOT NULL,
	"avatar_url" text,
	"content_strictness" "content_strictness" DEFAULT 'standard' NOT NULL,
	"allow_publish" boolean DEFAULT false NOT NULL,
	"allow_remix" boolean DEFAULT false NOT NULL,
	"daily_minute_limit" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"flagged_content" text NOT NULL,
	"reason" text NOT NULL,
	"severity" "moderation_severity" NOT NULL,
	"action_taken" text NOT NULL,
	"reviewed_by_human" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"original_prompt" text NOT NULL,
	"moderated_prompt" text NOT NULL,
	"moderation_action" "moderation_action" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"world_key" text NOT NULL,
	"hero_name" text NOT NULL,
	"problem_text" text NOT NULL,
	"status" "story_status" DEFAULT 'draft' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"chapter_count" integer DEFAULT 0 NOT NULL,
	"moderation_flags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"ai_content" text NOT NULL,
	"child_content" text,
	"chosen_action_key" text,
	"moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"model_used" text NOT NULL,
	"token_usage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "child_profile" ADD CONSTRAINT "child_profile_parent_user_id_user_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_event" ADD CONSTRAINT "moderation_event_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_log" ADD CONSTRAINT "prompt_log_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story" ADD CONSTRAINT "story_child_profile_id_child_profile_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_page" ADD CONSTRAINT "story_page_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "child_profile_parent_user_id_idx" ON "child_profile" USING btree ("parent_user_id");--> statement-breakpoint
CREATE INDEX "moderation_event_severity_created_at_idx" ON "moderation_event" USING btree ("severity","created_at" desc);--> statement-breakpoint
CREATE INDEX "story_child_profile_created_at_idx" ON "story" USING btree ("child_profile_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "story_page_story_id_page_number_idx" ON "story_page" USING btree ("story_id","page_number");