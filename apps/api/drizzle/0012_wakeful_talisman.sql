CREATE TABLE "ride_route_cells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid NOT NULL,
	"h3_res7" varchar(15) NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"point_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "cities" CASCADE;--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "country_code" SET DATA TYPE "public"."country_code" USING "country_code"::"public"."country_code";--> statement-breakpoint
ALTER TABLE "ride_stops" ADD COLUMN "is_dynamic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ride_route_cells" ADD CONSTRAINT "ride_route_cells_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE cascade ON UPDATE no action;