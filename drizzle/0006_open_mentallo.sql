ALTER TABLE "story" ADD COLUMN "parent_story_id" uuid;--> statement-breakpoint
ALTER TABLE "story" ADD CONSTRAINT "story_parent_story_id_story_id_fk" FOREIGN KEY ("parent_story_id") REFERENCES "public"."story"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "story_parent_story_id_idx" ON "story" USING btree ("parent_story_id");