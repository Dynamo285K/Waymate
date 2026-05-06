ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
DROP INDEX "user_email_lower_uq";--> statement-breakpoint
DROP INDEX "cars_spz_country_code_uq";--> statement-breakpoint
DROP INDEX "reviews_ride_author_subject_uq";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone_verified_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_active_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "ban_expires" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "cars" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "cars" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "cars" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "cars" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "cars" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "rides" ALTER COLUMN "departure_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "rides" ALTER COLUMN "arrival_estimate_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "rides" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "rides" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "rides" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "rides" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "rides" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "planned_arrival_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "planned_departure_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "ride_stops" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "prices" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "prices" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "prices" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "prices" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "booking_status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "confirmed_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "cancelled_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "no_show_marked_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "review_status" SET DEFAULT 'VISIBLE';--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "driver_last_read_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "passenger_last_read_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "sent_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "edited_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "read_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "sent_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_status_history" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "user_status_history" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ride_status_history" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "ride_status_history" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "booking_status_history" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "booking_status_history" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "blocklist" ALTER COLUMN "revoked_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "blocklist" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "blocklist" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "blocklist" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "blocklist" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "blocklist" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "deleted_at" timestamp (6) with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_lower_uq" ON "users" USING btree (lower("email")) WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "cars_spz_country_code_uq" ON "cars" USING btree ("spz","country_code") WHERE "cars"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_ride_author_subject_uq" ON "reviews" USING btree ("ride_id","author_id","subject_id") WHERE "reviews"."deleted_at" IS NULL;--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at_to_now()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER trg_users_set_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_cars_set_updated_at BEFORE UPDATE ON "cars" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_rides_set_updated_at BEFORE UPDATE ON "rides" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_ride_stops_set_updated_at BEFORE UPDATE ON "ride_stops" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_prices_set_updated_at BEFORE UPDATE ON "prices" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_bookings_set_updated_at BEFORE UPDATE ON "bookings" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_reviews_set_updated_at BEFORE UPDATE ON "reviews" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_conversations_set_updated_at BEFORE UPDATE ON "conversations" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_messages_set_updated_at BEFORE UPDATE ON "messages" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_notifications_set_updated_at BEFORE UPDATE ON "notifications" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();--> statement-breakpoint
CREATE TRIGGER trg_blocklist_set_updated_at BEFORE UPDATE ON "blocklist" FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();