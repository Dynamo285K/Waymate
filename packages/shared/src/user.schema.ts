import { z } from "zod";
import { userStatusValues } from "./status-values";

export const UserIdSchema = z.uuid();
export type UserId = z.infer<typeof UserIdSchema>;

export const UserStatusSchema = z.enum(userStatusValues);

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
    id: UserIdSchema,
    name: z.string(),
    email: EmailSchema,
    emailVerified: z.boolean(),
    image: z.string().nullable(),

    firstName: CapitalizedNameSchema.nullable(),
    lastName: CapitalizedNameSchema.nullable(),
    displayName: DisplayNameSchema.nullable(),
    phone: PhoneSchema.nullable(),
    profilePhotoUrl: z.url().nullable(),
    bio: z.string().max(500).nullable(),
    userStatus: UserStatusSchema,

    emailVerifiedAt: z.date().nullable(),
    phoneVerifiedAt: z.date().nullable(),
    lastActiveAt: z.date().nullable(),

    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const OnboardingUserBodySchema = z.object({
    firstName: CapitalizedNameSchema,
    lastName: CapitalizedNameSchema,
    phone: PhoneSchema,
});

export const UpdateUserBodySchema = z.object({
    firstName: CapitalizedNameSchema.optional(),
    lastName: CapitalizedNameSchema.optional(),
    displayName: DisplayNameSchema.optional(),
    phone: PhoneSchema.optional(),
    bio: z.string().trim().max(500).optional(),
    profilePhotoUrl: z.url().optional(),
});

export const PublicUserPreviewSchema = z.object({
    id: UserIdSchema,
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    profilePhotoUrl: z.url().nullable(),
});

export const PublicUserPreviewWithRatingSchema =
    PublicUserPreviewSchema.extend({
        averageRating: z.number().nullable(),
        reviewCount: z.number().int(),
    });

export type PublicUserPreview = z.infer<typeof PublicUserPreviewSchema>;
export type PublicUserPreviewWithRating = z.infer<
    typeof PublicUserPreviewWithRatingSchema
>;

export const UserStatusHistoryIdSchema = z.uuid();

export const UserStatusHistoryEntitySchema = z.object({
    id: UserStatusHistoryIdSchema,
    userId: UserIdSchema,

    oldStatus: UserStatusSchema.nullable(),
    newStatus: UserStatusSchema,
    changedByUserId: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),

    createdAt: z.date(),
});

export type OnboardingUserBody = z.infer<typeof OnboardingUserBodySchema>;
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>;
