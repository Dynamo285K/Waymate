import { z } from "zod";
import { UserStatusIdSchema } from "./user-statuses.schema";

export const UserIdSchema = z.uuid();

export const EmailSchema = z.email();

export const PhoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/);

export const UserEntitySchema = z.object({
    // Identity and authentication
    id: UserIdSchema,
    email: EmailSchema,
    password_hash: z.string(),
    user_status_id: UserStatusIdSchema,

    // Profile information
    first_name: z.string(),
    last_name: z.string(),
    display_name: z.string(),
    phone: PhoneSchema.nullable(),
    profile_photo_url: z.url().nullable(),
    bio: z.string().nullable(),

    // Ratings and activity metrics
    avg_rating: z.number().min(0).max(5),
    rating_count: z.number().int().min(0),
    completed_rides_count: z.number().int().min(0),
    no_show_count: z.number().int().min(0),

    // Verification and activity
    email_verified_at: z.date().nullable(),
    phone_verified_at: z.date().nullable(),
    last_active_at: z.date().nullable(),

    // Timestamps
    created_at: z.date(),
    updated_at: z.date(),
    deleted_at: z.date().nullable(),
});

export type User = z.infer<typeof UserEntitySchema>;
