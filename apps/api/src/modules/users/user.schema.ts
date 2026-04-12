import { z } from "zod";
import { userStatusValues } from "../../shared";

export const UserIdSchema = z.uuid();
export type UserId = z.infer<typeof UserIdSchema>;

export const UserStatusSchema = z.enum(userStatusValues);
export type UserStatus = z.infer<typeof UserStatusSchema>;

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

const EmailInputSchema = z.string().trim().email().max(254);
const PhoneInputSchema = z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{1,14}$/)
    .max(16);

const CapitalizedNameInputSchema = z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^\p{Lu}/u, "Must start with a capital letter")
    .regex(/^\S+$/, "Must not contain spaces");

const DisplayNameInputSchema = z
    .string()
    .trim()
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

export const UserOutputSchema = UserEntitySchema.pick({
    id: true,
    email: true,
    user_status: true,

    first_name: true,
    last_name: true,
    display_name: true,
    phone: true,
    profile_photo_url: true,
    bio: true,

    email_verified_at: true,
    phone_verified_at: true,
    last_active_at: true,

    created_at: true,
});

export const UserInputSchema = z.object({
    email: EmailInputSchema,
    password: z.string().min(8).max(128),
    first_name: CapitalizedNameInputSchema,
    last_name: CapitalizedNameInputSchema,
    display_name: DisplayNameInputSchema,
    phone: PhoneInputSchema.nullable(),
    profile_photo_url: z.string().trim().url().nullable(),
    bio: z.string().trim().max(500).nullable(),
});

export const UserStatusHistoryIdSchema = z.uuid();

export const UserStatusHistoryEntitySchema = z.object({
    // Identity and relationships
    id: UserStatusHistoryIdSchema,
    user_id: UserIdSchema,

    // Status transition
    old_status: UserStatusSchema.nullable(),
    new_status: UserStatusSchema,
    changed_by_user_id: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),

    // Timestamps
    created_at: z.date(),
});

export type User = z.infer<typeof UserEntitySchema>;
export type UserOutput = z.infer<typeof UserOutputSchema>;
export type UserInput = z.infer<typeof UserInputSchema>;
export type UserStatusHistory = z.infer<typeof UserStatusHistoryEntitySchema>;
