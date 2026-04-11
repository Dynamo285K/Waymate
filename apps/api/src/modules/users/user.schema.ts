import { z } from "zod";
import { UserIdSchema } from "./user-id.schema";
import { UserStatusSchema } from "./user-statuses.schema";

const EmailSchema = z.email().max(254);

const PhoneSchema = z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/)
    .max(16);

const CapitalizedNameSchema = z
    .string()
    .min(1)
    .max(20)
    .regex(/^\p{Lu}/u, "Must start with a capital letter")
    .regex(/^\S+$/, "Must not contain spaces");

const DisplayNameSchema = z
    .string()
    .min(1)
    .max(20)
    .regex(/^\S+$/, "Must not contain spaces");

export const UserEntitySchema = z.object({
    // Identity and authentication
    id: UserIdSchema,
    email: EmailSchema,
    password_hash: z.string().min(1).max(255),
    user_status: UserStatusSchema,

    // Profile information
    first_name: CapitalizedNameSchema,
    last_name: CapitalizedNameSchema,
    display_name: DisplayNameSchema,
    phone: PhoneSchema.nullable(),
    profile_photo_url: z.url().nullable(),
    bio: z.string().max(500).nullable(),

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
