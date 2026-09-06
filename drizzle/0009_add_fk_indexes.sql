CREATE INDEX "moderation_event_story_id_idx" ON "moderation_event" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "prompt_log_story_id_idx" ON "prompt_log" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_audio_story_page_id_idx" ON "story_audio" USING btree ("story_page_id");--> statement-breakpoint
CREATE INDEX "story_image_story_page_id_idx" ON "story_image" USING btree ("story_page_id");