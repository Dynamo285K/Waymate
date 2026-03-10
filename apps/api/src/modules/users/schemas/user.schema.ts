import { z } from 'zod';
import { UserStatusSchema } from './user-statuses.schema';

export const UserIdSchema = z.string().uuid();

export const EmailSchema = z.string().email();

export const PhoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/);

export const UserEntitySchema = z.object({
    id: UserIdSchema,
    email: EmailSchema,
    password_hash: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    display_name: z.string(),
    phone: PhoneSchema.nullable(),
    profile_photo_url: z.string().url().nullable(),
    bio: z.string().nullable(),
    avg_rating: z.number().min(0).max(5).nullable(),
    rating_count: z.number().int().min(0), 
    completed_rides_count: z.number().int().min(0),
    no_show_count: z.number().int().min(0),
    email_verified_at: z.date().nullable(),
    phone_verified_at: z.date().nullable(),
    last_active_at: z.date().nullable(),
    user_status_id: UserStatusSchema,
    created_at: z.date(),
    updated_at: z.date().nullable(),
    deleted_at: z.date().nullable(),


});


export type User = z.infer<typeof UserEntitySchema>;

