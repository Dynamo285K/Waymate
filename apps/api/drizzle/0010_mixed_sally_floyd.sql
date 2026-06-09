ALTER TABLE "ride_stops" ALTER COLUMN "city_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ride_stops" ADD COLUMN "city" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ride_stops" ADD COLUMN "country_code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ride_stops" ADD COLUMN "h3_res7" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "ride_stops" ADD COLUMN "h3_res8" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "ride_stops_h3_res7_idx" ON "ride_stops" USING btree ("h3_res7");--> statement-breakpoint
CREATE INDEX "ride_stops_h3_res8_idx" ON "ride_stops" USING btree ("h3_res8");