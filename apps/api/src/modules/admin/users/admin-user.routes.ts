import { Elysia } from "elysia";
import {
    AdminUserIdParamsSchema,
    AdminUserListQuerySchema,
    AdminUserListItemSchema,
    AdminUserListResponseSchema,
    AdminUserDetailSchema,
    AdminUserStatusHistoryItemSchema,
    AdminUserDetailResponseSchema,
    UpdateUserStatusBodySchema,
    ErrorResponseSchema,
} from "@repo/shared";
import { AdminUserService } from "./admin-user.service";
import { requireAdmin } from "../../auth/auth.middleware";

export const AdminUserRoutes = new Elysia()
    .use(requireAdmin)
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
    .guard({ auth: true, admin: true }, (app) =>
        app
            .get(
                "/users",
                async ({ query }) => {
                    return await AdminUserService.getUserList({
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
                        429: "ErrorResponse",
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
                    await AdminUserService.getUserDetail(params.id),
                {
                    params: AdminUserIdParamsSchema,
                    response: {
                        200: "AdminUserDetailResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
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
                    await AdminUserService.setUserStatus({
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
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Changes a user's account status (ACTIVE / SUSPENDED / BANNED / DELETED) and records an audit row in user_status_history.",
                    },
                }
            )
    );
