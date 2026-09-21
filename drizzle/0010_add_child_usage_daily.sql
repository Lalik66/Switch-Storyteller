CREATE TABLE "child_usage_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"usage_date" date NOT NULL,
	"seconds_used" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "child_usage_daily" ADD CONSTRAINT "child_usage_daily_child_profile_id_child_profile_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "child_usage_daily_child_date_unique_idx" ON "child_usage_daily" USING btree ("child_profile_id","usage_date");