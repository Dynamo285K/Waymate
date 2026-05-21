ALTER TABLE "rides" ADD COLUMN "auto_end_at" timestamp (6) with time zone;--> statement-breakpoint
CREATE INDEX "rides_auto_end_at_idx" ON "rides" USING btree ("auto_end_at");--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_auto_end_after_departure_chk" CHECK ("rides"."auto_end_at" IS NULL OR "rides"."auto_end_at" >= "rides"."departure_at");