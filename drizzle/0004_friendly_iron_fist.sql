CREATE TABLE "story_audio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_page_id" uuid NOT NULL,
	"url" text NOT NULL,
	"audio_hash" text NOT NULL,
	"voice_id" text NOT NULL,
	"model_used" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_audio_audio_hash_unique" UNIQUE("audio_hash")
);
--> statement-breakpoint
ALTER TABLE "story_audio" ADD CONSTRAINT "story_audio_story_page_id_story_page_id_fk" FOREIGN KEY ("story_page_id") REFERENCES "public"."story_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "story_audio_audio_hash_idx" ON "story_audio" USING btree ("audio_hash");