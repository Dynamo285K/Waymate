ALTER TABLE "ride_stops" DROP CONSTRAINT "ride_stops_city_len_chk";--> statement-breakpoint
DROP INDEX "ride_stops_city_idx";--> statement-breakpoint
DROP INDEX "ride_stops_country_code_idx";--> statement-breakpoint
ALTER TABLE "ride_stops" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "ride_stops" DROP COLUMN "country_code";