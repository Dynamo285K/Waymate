import { z } from "zod";
import {
    UserEntitySchema,
    UserIdSchema,
    UserRoleSchema,
    UserStatusSchema,
} from "./user.schema";

export const AdminUserIdParamsSchema = z.object({
    id: UserIdSchema,
});

export const AdminUserListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: UserIdSchema.optional(),
    userRole: UserRoleSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const AdminUserListItemSchema = UserEntitySchema.pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    userRole: true,
    userStatus: true,
    createdAt: true,
    lastActiveAt: true,
});

export const AdminUserListResponseSchema = z.object({
    items: z.array(AdminUserListItemSchema),
    nextCursor: UserIdSchema.nullable(),
});

export const AdminUserDetailSchema = UserEntitySchema.pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    displayName: true,
    phone: true,
    bio: true,
    profilePhotoUrl: true,
    userRole: true,
    userStatus: true,
    emailVerifiedAt: true,
    phoneVerifiedAt: true,
    lastActiveAt: true,
    createdAt: true,
    updatedAt: true,
});

export const AdminUserStatusHistoryItemSchema = z.object({
    id: z.uuid(),
    oldStatus: UserStatusSchema.nullable(),
    newStatus: UserStatusSchema,
    reason: z.string().nullable(),
    createdAt: z.date(),
    changedBy: z
        .object({
            id: UserIdSchema,
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
        })
        .nullable(),
});

export const AdminUserDetailResponseSchema = z.object({
    user: AdminUserDetailSchema,
    statusHistory: z.array(AdminUserStatusHistoryItemSchema),
});

export const UpdateUserRoleBodySchema = z
    .object({
        userRole: UserRoleSchema,
    })
    .strict();

export const UpdateUserStatusBodySchema = z
    .object({
        status: UserStatusSchema,
        reason: z.string().trim().min(1).max(500).optional(),
    })
    .strict();

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;
export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>;
export type AdminUserStatusHistoryItem = z.infer<
    typeof AdminUserStatusHistoryItemSchema
>;
export type AdminUserDetailResponse = z.infer<
    typeof AdminUserDetailResponseSchema
>;
export type UpdateUserRoleBody = z.infer<typeof UpdateUserRoleBodySchema>;
export type UpdateUserStatusBody = z.infer<typeof UpdateUserStatusBodySchema>;
