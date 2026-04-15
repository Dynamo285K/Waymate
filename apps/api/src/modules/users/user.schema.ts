import { z } from "zod";
import { userStatusValues } from "../../shared";

// User ID is UUID in DB schema.
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
    // --- Better-Auth povinné polia ---
    id: UserIdSchema,
    name: z.string(),
    email: EmailSchema,
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    // password_hash je odstránené, patrí do account tabuľky

    // --- Tvoje Waymate profilové informácie ---
    firstName: CapitalizedNameSchema.nullable(),
    lastName: CapitalizedNameSchema.nullable(),
    displayName: DisplayNameSchema.nullable(),
    phone: PhoneSchema.nullable(),
    profilePhotoUrl: z.url().nullable(),
    bio: z.string().max(500).nullable(),
    userStatus: UserStatusSchema,

    // --- Verifikácie a aktivita ---
    emailVerifiedAt: z.date().nullable(),
    phoneVerifiedAt: z.date().nullable(),
    lastActiveAt: z.date().nullable(),

    // --- Časové pečiatky ---
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const UserOutputSchema = UserEntitySchema.pick({
    id: true,
    name: true,
    email: true,
    emailVerified: true,
    image: true,
    userStatus: true,

    firstName: true,
    lastName: true,
    displayName: true,
    phone: true,
    profilePhotoUrl: true,
    bio: true,

    emailVerifiedAt: true,
    phoneVerifiedAt: true,
    lastActiveAt: true,

    createdAt: true,
    updatedAt: true,
});

const UserMutableFieldsSchema = z.object({
    email: EmailInputSchema,
    firstName: CapitalizedNameInputSchema.nullable(),
    lastName: CapitalizedNameInputSchema.nullable(),
    displayName: DisplayNameInputSchema.nullable(),
    phone: PhoneInputSchema.nullable(),
    profilePhotoUrl: z.string().trim().nullable(),
    bio: z.string().trim().max(500).nullable(),
    userStatus: UserStatusSchema,
});

export const UserInputSchema = UserMutableFieldsSchema.partial();

// 3. ZMENA: Aj tu prepisujeme na camelCase, aby to sedelo s Drizzle
export const UserStatusHistoryIdSchema = z.string();

export const UserStatusHistoryEntitySchema = z.object({
    id: UserStatusHistoryIdSchema,
    userId: UserIdSchema,

    oldStatus: UserStatusSchema.nullable(),
    newStatus: UserStatusSchema,
    changedByUserId: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),

    createdAt: z.date(),
});

export type User = z.infer<typeof UserEntitySchema>;
export type UserOutput = z.infer<typeof UserOutputSchema>;
export type UserInput = z.infer<typeof UserInputSchema>;
export type UserStatusHistory = z.infer<typeof UserStatusHistoryEntitySchema>;
