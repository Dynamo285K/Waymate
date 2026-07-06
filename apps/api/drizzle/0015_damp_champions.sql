ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'BOOKING_REJECTED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'RIDE_CANCELLED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'RIDE_COMPLETED';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "payload" jsonb;