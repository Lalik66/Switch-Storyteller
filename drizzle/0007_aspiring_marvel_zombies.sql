CREATE TABLE "child_badge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"badge_key" text NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "child_badge" ADD CONSTRAINT "child_badge_child_profile_id_child_profile_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "child_badge_child_key_unique_idx" ON "child_badge" USING btree ("child_profile_id","badge_key");--> statement-breakpoint
CREATE INDEX "child_badge_child_awarded_idx" ON "child_badge" USING btree ("child_profile_id","awarded_at" desc);