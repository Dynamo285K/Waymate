import { Elysia } from "elysia";
import {
    AdminUserDetailResponseSchema,
    AdminUserDetailSchema,
    AdminUserIdParamsSchema,
    AdminUserListItemSchema,
    AdminUserListQuerySchema,
    AdminUserListResponseSchema,
    AdminUserStatusHistoryItemSchema,
    ErrorResponseSchema,
    UpdateUserRoleBodySchema,
    UpdateUserStatusBodySchema,
} from "@repo/shared";
import { requireAdmin } from "../auth/auth.middleware";
import { AdminError, adminErrorToHttpStatus } from "./admin.errors";
import { AdminService } from "./admin.service";

export const AdminRoutes = new Elysia({
    prefix: "/admin",
    tags: ["Admin"],
})
    .model({
        AdminUserIdParams: AdminUserIdParamsSchema,
        AdminUserListQuery: AdminUserListQuerySchema,
        AdminUserListItem: AdminUserListItemSchema,
        AdminUserListResponse: AdminUserListResponseSchema,
        AdminUserDetail: AdminUserDetailSchema,
        AdminUserStatusHistoryItem: AdminUserStatusHistoryItemSchema,
        AdminUserDetailResponse: AdminUserDetailResponseSchema,
        UpdateUserRoleBody: UpdateUserRoleBodySchema,
        UpdateUserStatusBody: UpdateUserStatusBodySchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .onError(({ code, status, error }) => {
        if (error instanceof AdminError) {
            return status(adminErrorToHttpStatus(error.code), {
                error: error.code,
            });
        }
        if (code === "VALIDATION" || code === "PARSE") {
            return status(400, { error: "VALIDATION" });
        }
        if (code === 401) {
            return status(401, { error: "UNAUTHORIZED" });
        }
        if (code === "INTERNAL_SERVER_ERROR" || code === "UNKNOWN") {
            return status(500, { error: "INTERNAL_SERVER_ERROR" });
        }
    })
    .use(requireAdmin)
    .guard({ auth: true, admin: true }, (app) =>
        app
            .get(
                "/users",
                async ({ query }) => {
                    return await AdminService.getUserList({
                        limit: query.limit,
                        cursor: query.cursor,
                        userRole: query.userRole,
                        search: query.search,
                    });
                },
                {
                    query: AdminUserListQuerySchema,
                    response: {
                        200: "AdminUserListResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns a keyset-paginated list of users for admin tooling. Supports filtering by role and a case-insensitive substring search across email, firstName, lastName.",
                    },
                }
            )
            .get(
                "/users/:id",
                async ({ params }) =>
                    await AdminService.getUserDetail(params.id),
                {
                    params: AdminUserIdParamsSchema,
                    response: {
                        200: "AdminUserDetailResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns full user detail plus the most recent status history entries (newest first, capped at 50). changedBy is null for system-triggered changes or when the actor admin no longer exists.",
                    },
                }
            )
            .patch(
                "/users/:id/role",
                async ({ user, params, body }) =>
                    await AdminService.setUserRole({
                        actorId: user.id,
                        targetUserId: params.id,
                        newRole: body.userRole,
                    }),
                {
                    params: AdminUserIdParamsSchema,
                    body: "UpdateUserRoleBody",
                    response: {
                        200: "AdminUserListItem",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Promotes a user to ADMIN or demotes back to USER. Self-demotion is rejected so the last admin cannot lock themselves out.",
                    },
                }
            )
            .patch(
                "/users/:id/status",
                async ({ user, params, body }) =>
                    await AdminService.setUserStatus({
                        actorId: user.id,
                        targetUserId: params.id,
                        newStatus: body.status,
                        reason: body.reason,
                    }),
                {
                    params: AdminUserIdParamsSchema,
                    body: "UpdateUserStatusBody",
                    response: {
                        200: "AdminUserListItem",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Changes a user's account status (ACTIVE / SUSPENDED / BANNED / DELETED) and records an audit row in user_status_history. Admins cannot change their own status.",
                    },
                }
            )
    );
