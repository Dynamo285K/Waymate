import { z } from "zod";
import { UserEntitySchema, UserIdSchema, UserRoleSchema } from "./user.schema";

export const AdminUserIdParamsSchema = z.object({
    id: UserIdSchema,
});

export const AdminUserListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: UserIdSchema.optional(),
    role: UserRoleSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const AdminUserListItemSchema = UserEntitySchema.pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    userStatus: true,
    createdAt: true,
    lastActiveAt: true,
});

export const AdminUserListResponseSchema = z.object({
    items: z.array(AdminUserListItemSchema),
    nextCursor: UserIdSchema.nullable(),
});

export const UpdateUserRoleBodySchema = z
    .object({
        role: UserRoleSchema,
    })
    .strict();

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;
export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;
export type UpdateUserRoleBody = z.infer<typeof UpdateUserRoleBodySchema>;
