CREATE TYPE "public"."report_status" AS ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('INAPPROPRIATE_BEHAVIOR', 'NO_SHOW', 'OVERCHARGING', 'LEFT_LUGGAGE', 'SAFETY_ISSUE', 'OTHER');--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"ride_id" uuid,
	"report_type" "report_type" NOT NULL,
	"report_status" "report_status" DEFAULT 'OPEN' NOT NULL,
	"description" text NOT NULL,
	"resolution_reason" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (6) with time zone,
	CONSTRAINT "reports_description_len_chk" CHECK (char_length("reports"."description") BETWEEN 1 AND 2000),
	CONSTRAINT "reports_resolution_reason_len_chk" CHECK ("reports"."resolution_reason" IS NULL OR char_length("reports"."resolution_reason") <= 500)
);
--> statement-breakpoint
CREATE TABLE "report_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"old_status" "report_status",
	"new_status" "report_status" NOT NULL,
	"changed_by_user_id" uuid,
	"reason" text,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_status_history_reason_len_chk" CHECK ("report_status_history"."reason" IS NULL OR char_length("report_status_history"."reason") <= 500)
);
--> statement-breakpoint
ALTER TABLE "ride_stops" ADD COLUMN "city_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_target_user_id_idx" ON "reports" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "reports_reporter_id_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("report_status");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "report_status_history_report_id_idx" ON "report_status_history" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_status_history_new_status_idx" ON "report_status_history" USING btree ("new_status");--> statement-breakpoint
CREATE INDEX "report_status_history_created_at_idx" ON "report_status_history" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "ride_stops" ADD CONSTRAINT "ride_stops_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ride_stops_city_id_idx" ON "ride_stops" USING btree ("city_id");--> statement-breakpoint
CREATE TRIGGER trg_reports_set_updated_at BEFORE UPDATE ON "reports" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();