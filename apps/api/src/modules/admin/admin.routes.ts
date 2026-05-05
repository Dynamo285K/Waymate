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
    UpdateUserStatusBodySchema,
} from "@repo/shared";
import { requireAdmin } from "../auth/auth.middleware";
import { createErrorHandler } from "../auth/auth.errors";
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
        UpdateUserStatusBody: UpdateUserStatusBodySchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .onError(createErrorHandler(AdminError, adminErrorToHttpStatus))
    .use(requireAdmin)
    .guard({ auth: true, admin: true }, (app) =>
        app
            .get(
                "/users",
                async ({ query }) => {
                    return await AdminService.getUserList({
                        limit: query.limit,
                        cursor: query.cursor,
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
                            "Returns a keyset-paginated list of users for admin tooling. Supports a case-insensitive substring search across email, firstName, lastName.",
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
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Changes a user's account status (ACTIVE / SUSPENDED / BANNED / DELETED) and records an audit row in user_status_history.",
                    },
                }
            )
    );
