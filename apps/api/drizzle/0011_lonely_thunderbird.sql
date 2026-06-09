ALTER TABLE "ride_stops" DROP CONSTRAINT "ride_stops_city_id_cities_id_fk";
--> statement-breakpoint
DROP INDEX "ride_stops_city_id_idx";--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "city" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "country_code" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "h3_res7" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "h3_res8" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ride_stops" DROP COLUMN "city_id";