CREATE TYPE "public"."block_reason" AS ENUM('HARASSMENT', 'SPAM', 'SAFETY', 'FRAUD', 'ABUSE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."block_status" AS ENUM('ACTIVE', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."car_color" AS ENUM('WHITE', 'BLACK', 'SILVER', 'GRAY', 'RED', 'BLUE', 'BROWN', 'GREEN', 'YELLOW', 'ORANGE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('RIDE', 'BOOKING', 'SUPPORT');--> statement-breakpoint
CREATE TYPE "public"."country_code" AS ENUM('AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'CH');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'READ');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('TEXT', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('BOOKING_REQUEST', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'MESSAGE_RECEIVED', 'RIDE_UPDATED', 'REVIEW_RECEIVED');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('VISIBLE', 'HIDDEN', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."ride_status" AS ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"first_name" text,
	"last_name" text,
	"display_name" text,
	"phone" text,
	"profile_photo_url" text,
	"bio" text,
	"email_verified_at" timestamp,
	"phone_verified_at" timestamp,
	"last_active_at" timestamp,
	"user_status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "user_email_len_chk" CHECK (char_length("users"."email") <= 254),
	CONSTRAINT "user_first_name_len_chk" CHECK (char_length("users"."first_name") BETWEEN 1 AND 20),
	CONSTRAINT "user_last_name_len_chk" CHECK (char_length("users"."last_name") BETWEEN 1 AND 20),
	CONSTRAINT "user_display_name_len_chk" CHECK (char_length("users"."display_name") BETWEEN 1 AND 20),
	CONSTRAINT "user_first_name_format_chk" CHECK ("users"."first_name" ~ '^[[:upper:]]' AND "users"."first_name" !~ '\s'),
	CONSTRAINT "user_last_name_format_chk" CHECK ("users"."last_name" ~ '^[[:upper:]]' AND "users"."last_name" !~ '\s'),
	CONSTRAINT "user_display_name_no_space_chk" CHECK ("users"."display_name" !~ '\s'),
	CONSTRAINT "user_phone_format_chk" CHECK ("users"."phone" IS NULL OR ("users"."phone" ~ '^\+[1-9][0-9]{1,14}$' AND char_length("users"."phone") <= 16)),
	CONSTRAINT "user_bio_len_chk" CHECK ("users"."bio" IS NULL OR char_length("users"."bio") <= 500)
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp (6) with time zone,
	"refresh_token_expires_at" timestamp (6) with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp (6) with time zone NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp (6) with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp (6) with time zone NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp (6) with time zone NOT NULL,
	"created_at" timestamp (6) with time zone NOT NULL,
	"updated_at" timestamp (6) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_models" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "car_models_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"brand" text NOT NULL,
	"model_name" text NOT NULL,
	CONSTRAINT "car_models_brand_len_chk" CHECK (char_length("car_models"."brand") BETWEEN 1 AND 100),
	CONSTRAINT "car_models_model_name_len_chk" CHECK (char_length("car_models"."model_name") BETWEEN 1 AND 100)
);
--> statement-breakpoint
CREATE TABLE "cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"model_id" integer NOT NULL,
	"spz" text NOT NULL,
	"country_code" "country_code" NOT NULL,
	"color" "car_color" NOT NULL,
	"seats_total" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "cars_seats_total_chk" CHECK ("cars"."seats_total" > 0),
	CONSTRAINT "cars_spz_len_chk" CHECK (char_length("cars"."spz") BETWEEN 2 AND 12),
	CONSTRAINT "cars_spz_format_chk" CHECK ("cars"."spz" ~ '^[A-Z0-9]+$')
);
--> statement-breakpoint
CREATE TABLE "rides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"car_id" uuid NOT NULL,
	"departure_at" timestamp NOT NULL,
	"arrival_estimate_at" timestamp,
	"ride_status" "ride_status" NOT NULL,
	"offered_seats" integer NOT NULL,
	"currency" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "rides_offered_seats_chk" CHECK ("rides"."offered_seats" > 0),
	CONSTRAINT "rides_arrival_after_departure_chk" CHECK ("rides"."arrival_estimate_at" IS NULL OR "rides"."arrival_estimate_at" >= "rides"."departure_at"),
	CONSTRAINT "rides_currency_chk" CHECK ("rides"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "rides_description_len_chk" CHECK ("rides"."description" IS NULL OR char_length("rides"."description") <= 500)
);
--> statement-breakpoint
CREATE TABLE "ride_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"country_code" "country_code",
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"stop_order" integer NOT NULL,
	"planned_arrival_at" timestamp,
	"planned_departure_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ride_stops_stop_order_chk" CHECK ("ride_stops"."stop_order" >= 0),
	CONSTRAINT "ride_stops_lat_chk" CHECK ("ride_stops"."lat" BETWEEN -90 AND 90),
	CONSTRAINT "ride_stops_lng_chk" CHECK ("ride_stops"."lng" BETWEEN -180 AND 180),
	CONSTRAINT "ride_stops_address_len_chk" CHECK (char_length("ride_stops"."address") BETWEEN 1 AND 255),
	CONSTRAINT "ride_stops_city_len_chk" CHECK (char_length("ride_stops"."city") BETWEEN 1 AND 100),
	CONSTRAINT "ride_stops_planned_time_order_chk" CHECK ("ride_stops"."planned_arrival_at" IS NULL OR "ride_stops"."planned_departure_at" IS NULL OR "ride_stops"."planned_departure_at" >= "ride_stops"."planned_arrival_at")
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid NOT NULL,
	"start_stop_id" uuid NOT NULL,
	"end_stop_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prices_amount_non_negative_chk" CHECK ("prices"."amount" >= 0),
	CONSTRAINT "prices_distinct_stops_chk" CHECK ("prices"."start_stop_id" <> "prices"."end_stop_id"),
	CONSTRAINT "prices_currency_chk" CHECK ("prices"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"passenger_id" uuid NOT NULL,
	"ride_id" uuid NOT NULL,
	"pickup_stop_id" uuid NOT NULL,
	"dropoff_stop_id" uuid NOT NULL,
	"seat_count" integer NOT NULL,
	"booking_status" "booking_status" NOT NULL,
	"price_amount" integer NOT NULL,
	"currency" text NOT NULL,
	"confirmed_at" timestamp,
	"cancelled_at" timestamp,
	"cancelled_by_user_id" uuid,
	"cancellation_reason" text,
	"no_show_marked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "bookings_distinct_stops_chk" CHECK ("bookings"."pickup_stop_id" <> "bookings"."dropoff_stop_id"),
	CONSTRAINT "bookings_seat_count_chk" CHECK ("bookings"."seat_count" > 0),
	CONSTRAINT "bookings_price_non_negative_chk" CHECK ("bookings"."price_amount" >= 0),
	CONSTRAINT "bookings_currency_chk" CHECK ("bookings"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "bookings_cancellation_reason_len_chk" CHECK ("bookings"."cancellation_reason" IS NULL OR char_length("bookings"."cancellation_reason") <= 500)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"review_status" "review_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_chk" CHECK ("reviews"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "reviews_author_subject_distinct_chk" CHECK ("reviews"."author_id" <> "reviews"."subject_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid,
	"booking_id" uuid,
	"conversation_type" "conversation_type" NOT NULL,
	"driver_last_read_at" timestamp,
	"passenger_last_read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "conversations_context_present_chk" CHECK ("conversations"."ride_id" IS NOT NULL OR "conversations"."booking_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"message_type" "message_type" NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp NOT NULL,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"reference_entity_type" text,
	"reference_entity_id" uuid,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"delivery_status" "delivery_status" NOT NULL,
	"read_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"old_status" "user_status",
	"new_status" "user_status" NOT NULL,
	"changed_by_user_id" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_status_history_reason_len_chk" CHECK ("user_status_history"."reason" IS NULL OR char_length("user_status_history"."reason") <= 500)
);
--> statement-breakpoint
CREATE TABLE "ride_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ride_id" uuid NOT NULL,
	"old_status" "ride_status",
	"new_status" "ride_status" NOT NULL,
	"changed_by_user_id" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ride_status_history_reason_len_chk" CHECK ("ride_status_history"."reason" IS NULL OR char_length("ride_status_history"."reason") <= 500)
);
--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"old_status" "booking_status",
	"new_status" "booking_status" NOT NULL,
	"changed_by_user_id" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_status_history_reason_len_chk" CHECK ("booking_status_history"."reason" IS NULL OR char_length("booking_status_history"."reason") <= 500)
);
--> statement-breakpoint
CREATE TABLE "blocklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_user_id" uuid NOT NULL,
	"blocked_user_id" uuid NOT NULL,
	"block_reason" "block_reason" NOT NULL,
	"block_status" "block_status" NOT NULL,
	"reason_text" text,
	"revoked_at" timestamp,
	"revoked_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "blocklist_no_self_block_chk" CHECK ("blocklist"."blocker_user_id" <> "blocklist"."blocked_user_id"),
	CONSTRAINT "blocklist_revoked_at_chk" CHECK ("blocklist"."revoked_at" IS NULL OR "blocklist"."revoked_at" >= "blocklist"."created_at"),
	CONSTRAINT "blocklist_reason_text_len_chk" CHECK ("blocklist"."reason_text" IS NULL OR char_length(trim("blocklist"."reason_text")) <= 500)
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_model_id_car_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."car_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rides" ADD CONSTRAINT "rides_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_stops" ADD CONSTRAINT "ride_stops_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_start_stop_id_ride_stops_id_fk" FOREIGN KEY ("start_stop_id") REFERENCES "public"."ride_stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_end_stop_id_ride_stops_id_fk" FOREIGN KEY ("end_stop_id") REFERENCES "public"."ride_stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_passenger_id_users_id_fk" FOREIGN KEY ("passenger_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pickup_stop_id_ride_stops_id_fk" FOREIGN KEY ("pickup_stop_id") REFERENCES "public"."ride_stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dropoff_stop_id_ride_stops_id_fk" FOREIGN KEY ("dropoff_stop_id") REFERENCES "public"."ride_stops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelled_by_user_id_users_id_fk" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_id_users_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_history" ADD CONSTRAINT "user_status_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_history" ADD CONSTRAINT "user_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_status_history" ADD CONSTRAINT "ride_status_history_ride_id_rides_id_fk" FOREIGN KEY ("ride_id") REFERENCES "public"."rides"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_status_history" ADD CONSTRAINT "ride_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocklist" ADD CONSTRAINT "blocklist_blocker_user_id_users_id_fk" FOREIGN KEY ("blocker_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocklist" ADD CONSTRAINT "blocklist_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocklist" ADD CONSTRAINT "blocklist_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_lower_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "user_status_idx" ON "users" USING btree ("user_status");--> statement-breakpoint
CREATE INDEX "user_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "car_models_brand_model_name_uq" ON "car_models" USING btree ("brand","model_name");--> statement-breakpoint
CREATE INDEX "car_models_model_name_idx" ON "car_models" USING btree ("model_name");--> statement-breakpoint
CREATE UNIQUE INDEX "cars_spz_country_code_uq" ON "cars" USING btree ("spz","country_code");--> statement-breakpoint
CREATE INDEX "cars_owner_id_idx" ON "cars" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "cars_model_id_idx" ON "cars" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "rides_driver_id_idx" ON "rides" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "rides_car_id_idx" ON "rides" USING btree ("car_id");--> statement-breakpoint
CREATE INDEX "rides_departure_at_idx" ON "rides" USING btree ("departure_at");--> statement-breakpoint
CREATE INDEX "rides_status_idx" ON "rides" USING btree ("ride_status");--> statement-breakpoint
CREATE INDEX "rides_offered_seats_idx" ON "rides" USING btree ("offered_seats");--> statement-breakpoint
CREATE INDEX "rides_created_at_idx" ON "rides" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ride_stops_ride_id_stop_order_uq" ON "ride_stops" USING btree ("ride_id","stop_order");--> statement-breakpoint
CREATE INDEX "ride_stops_city_idx" ON "ride_stops" USING btree ("city");--> statement-breakpoint
CREATE INDEX "ride_stops_country_code_idx" ON "ride_stops" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "ride_stops_lat_idx" ON "ride_stops" USING btree ("lat");--> statement-breakpoint
CREATE INDEX "ride_stops_lng_idx" ON "ride_stops" USING btree ("lng");--> statement-breakpoint
CREATE UNIQUE INDEX "prices_ride_start_end_uq" ON "prices" USING btree ("ride_id","start_stop_id","end_stop_id");--> statement-breakpoint
CREATE INDEX "prices_start_stop_id_idx" ON "prices" USING btree ("start_stop_id");--> statement-breakpoint
CREATE INDEX "prices_end_stop_id_idx" ON "prices" USING btree ("end_stop_id");--> statement-breakpoint
CREATE INDEX "bookings_passenger_id_idx" ON "bookings" USING btree ("passenger_id");--> statement-breakpoint
CREATE INDEX "bookings_ride_id_idx" ON "bookings" USING btree ("ride_id");--> statement-breakpoint
CREATE INDEX "bookings_pickup_stop_id_idx" ON "bookings" USING btree ("pickup_stop_id");--> statement-breakpoint
CREATE INDEX "bookings_dropoff_stop_id_idx" ON "bookings" USING btree ("dropoff_stop_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("booking_status");--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_ride_author_subject_uq" ON "reviews" USING btree ("ride_id","author_id","subject_id");--> statement-breakpoint
CREATE INDEX "reviews_subject_id_idx" ON "reviews" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversations_ride_id_idx" ON "conversations" USING btree ("ride_id");--> statement-breakpoint
CREATE INDEX "conversations_booking_id_idx" ON "conversations" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "conversations_type_idx" ON "conversations" USING btree ("conversation_type");--> statement-breakpoint
CREATE INDEX "conversations_updated_at_idx" ON "conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_sender_id_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "messages_sent_at_idx" ON "messages" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("notification_type");--> statement-breakpoint
CREATE INDEX "notifications_delivery_status_idx" ON "notifications" USING btree ("delivery_status");--> statement-breakpoint
CREATE INDEX "notifications_read_at_idx" ON "notifications" USING btree ("read_at");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_status_history_user_id_idx" ON "user_status_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_status_history_new_status_idx" ON "user_status_history" USING btree ("new_status");--> statement-breakpoint
CREATE INDEX "user_status_history_created_at_idx" ON "user_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ride_status_history_ride_id_idx" ON "ride_status_history" USING btree ("ride_id");--> statement-breakpoint
CREATE INDEX "ride_status_history_new_status_idx" ON "ride_status_history" USING btree ("new_status");--> statement-breakpoint
CREATE INDEX "ride_status_history_created_at_idx" ON "ride_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "booking_status_history_booking_id_idx" ON "booking_status_history" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_status_history_new_status_idx" ON "booking_status_history" USING btree ("new_status");--> statement-breakpoint
CREATE INDEX "booking_status_history_created_at_idx" ON "booking_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blocklist_blocker_user_id_idx" ON "blocklist" USING btree ("blocker_user_id");--> statement-breakpoint
CREATE INDEX "blocklist_blocked_user_id_idx" ON "blocklist" USING btree ("blocked_user_id");--> statement-breakpoint
CREATE INDEX "blocklist_reason_idx" ON "blocklist" USING btree ("block_reason");--> statement-breakpoint
CREATE INDEX "blocklist_status_idx" ON "blocklist" USING btree ("block_status");--> statement-breakpoint
CREATE INDEX "blocklist_created_at_idx" ON "blocklist" USING btree ("created_at");