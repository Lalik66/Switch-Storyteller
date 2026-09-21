ALTER TABLE "story_audio" DROP CONSTRAINT "story_audio_audio_hash_unique";--> statement-breakpoint
ALTER TABLE "story_image" DROP CONSTRAINT "story_image_scene_hash_unique";--> statement-breakpoint
DROP INDEX "parent_report_parent_child_week_idx";--> statement-breakpoint
DROP INDEX "story_audio_story_page_id_idx";--> statement-breakpoint
DROP INDEX "story_image_story_page_id_idx";--> statement-breakpoint
DROP INDEX "story_page_story_id_page_number_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "character_child_lower_name_unique_idx" ON "character" USING btree ("child_profile_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "parent_report_parent_child_week_unique_idx" ON "parent_report" USING btree ("parent_user_id","child_profile_id","week_ending");--> statement-breakpoint
CREATE INDEX "story_published_created_idx" ON "story" USING btree ("created_at" desc) WHERE "story"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "story_audio_story_page_id_unique_idx" ON "story_audio" USING btree ("story_page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "story_image_story_page_id_unique_idx" ON "story_image" USING btree ("story_page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "story_page_story_id_page_number_unique_idx" ON "story_page" USING btree ("story_id","page_number");