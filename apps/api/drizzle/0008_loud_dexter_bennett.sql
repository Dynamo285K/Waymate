CREATE TYPE "public"."ride_end_source" AS ENUM('DRIVER', 'AUTO', 'ADMIN');--> statement-breakpoint
ALTER TABLE "rides" ADD COLUMN "ended_at" timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "rides" ADD COLUMN "ended_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "rides" ADD COLUMN "end_source" "ride_end_source";--> statement-breakpoint
ALTER TABLE "rides" ADD COLUMN "end_reason" text;--> statement-breakpoint
ALTER TABLE "rides" ADD COLUMN "auto_end_processed_at" timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_ended_by_user_id_users_id_fk" FOREIGN KEY ("ended_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rides_arrival_estimate_at_idx" ON "rides" USING btree ("arrival_estimate_at");--> statement-breakpoint
CREATE INDEX "rides_ended_at_idx" ON "rides" USING btree ("ended_at");--> statement-breakpoint
CREATE INDEX "rides_end_source_idx" ON "rides" USING btree ("end_source");--> statement-breakpoint
CREATE INDEX "rides_auto_end_processed_at_idx" ON "rides" USING btree ("auto_end_processed_at");--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_end_reason_len_chk" CHECK ("rides"."end_reason" IS NULL OR char_length("rides"."end_reason") <= 500);--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_end_metadata_presence_chk" CHECK (("rides"."ended_at" IS NULL AND "rides"."ended_by_user_id" IS NULL AND "rides"."end_source" IS NULL AND "rides"."end_reason" IS NULL AND "rides"."auto_end_processed_at" IS NULL) OR ("rides"."ended_at" IS NOT NULL AND "rides"."end_source" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_human_end_actor_chk" CHECK ("rides"."end_source" IS NULL OR "rides"."end_source" = 'AUTO' OR "rides"."ended_by_user_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_auto_end_actor_chk" CHECK ("rides"."end_source" <> 'AUTO' OR "rides"."ended_by_user_id" IS NULL);--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_auto_end_processed_source_chk" CHECK ("rides"."auto_end_processed_at" IS NULL OR "rides"."end_source" = 'AUTO');