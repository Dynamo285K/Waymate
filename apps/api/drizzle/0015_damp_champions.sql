ALTER TYPE "public"."notification_type" ADD VALUE 'BOOKING_REJECTED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'RIDE_CANCELLED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'RIDE_COMPLETED';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "payload" jsonb;