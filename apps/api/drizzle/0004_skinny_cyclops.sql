CREATE TABLE "review_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"old_status" "review_status",
	"new_status" "review_status" NOT NULL,
	"changed_by_user_id" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_status_history_reason_len_chk" CHECK ("review_status_history"."reason" IS NULL OR char_length("review_status_history"."reason") <= 500)
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" integer NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"country_code" "country_code" NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"population" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cities_name_len_chk" CHECK (char_length("cities"."name") BETWEEN 1 AND 200),
	CONSTRAINT "cities_name_normalized_len_chk" CHECK (char_length("cities"."name_normalized") BETWEEN 1 AND 200),
	CONSTRAINT "cities_lat_chk" CHECK ("cities"."lat" BETWEEN -90 AND 90),
	CONSTRAINT "cities_lng_chk" CHECK ("cities"."lng" BETWEEN -180 AND 180),
	CONSTRAINT "cities_population_chk" CHECK ("cities"."population" >= 0)
);
--> statement-breakpoint
ALTER TABLE "review_status_history" ADD CONSTRAINT "review_status_history_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_status_history" ADD CONSTRAINT "review_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_status_history_review_id_idx" ON "review_status_history" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_status_history_new_status_idx" ON "review_status_history" USING btree ("new_status");--> statement-breakpoint
CREATE INDEX "review_status_history_created_at_idx" ON "review_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_external_id_uq" ON "cities" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_name_normalized_country_code_uq" ON "cities" USING btree ("name_normalized","country_code");--> statement-breakpoint
CREATE INDEX "cities_country_code_idx" ON "cities" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "cities_population_idx" ON "cities" USING btree ("population");--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "cities_name_normalized_trgm_idx" ON "cities" USING gin ("name_normalized" gin_trgm_ops);--> statement-breakpoint
CREATE TRIGGER trg_cities_set_updated_at BEFORE UPDATE ON "cities" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();