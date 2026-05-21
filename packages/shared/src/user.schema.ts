import { z } from "zod";
import { userRoleValues, userStatusValues } from "./status-values";
import {
    BIO_MAX_LENGTH,
    NAME_MAX_LENGTH,
    NAME_START_CAPITAL_REGEX,
    NO_WHITESPACE_REGEX,
    phoneField,
} from "./validation";

export const UserIdSchema = z.uuid();
export type UserId = z.infer<typeof UserIdSchema>;

export const UserStatusSchema = z.enum(userStatusValues);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserRoleSchema = z.enum(userRoleValues);
export type UserRole = z.infer<typeof UserRoleSchema>;

const EmailSchema = z.email().max(254);

const PhoneSchema = phoneField();

const CapitalizedNameSchema = z
    .string()
    .min(1)
    .max(NAME_MAX_LENGTH)
    .regex(NAME_START_CAPITAL_REGEX, "Must start with a capital letter")
    .regex(NO_WHITESPACE_REGEX, "Must not contain spaces");

const DisplayNameSchema = z
    .string()
    .min(1)
    .max(NAME_MAX_LENGTH)
    .regex(NO_WHITESPACE_REGEX, "Must not contain spaces");

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
    bio: z.string().max(BIO_MAX_LENGTH).nullable(),
    userStatus: UserStatusSchema,
    userRole: UserRoleSchema,

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
    bio: z.string().trim().max(BIO_MAX_LENGTH).optional(),
    profilePhotoUrl: z.url().optional(),
});

export const PublicUserPreviewSchema = z.object({
    id: UserIdSchema,
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    profilePhotoUrl: z.url().nullable(),
});

export const PublicUserPreviewWithRatingSchema = PublicUserPreviewSchema.extend(
    {
        averageRating: z.number().nullable(),
        reviewCount: z.number().int(),
    }
);

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
