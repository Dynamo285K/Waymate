import { Elysia } from "elysia";
import {
    AdminUserIdParamsSchema,
    AdminUserListItemSchema,
    AdminUserListQuerySchema,
    AdminUserListResponseSchema,
    ErrorResponseSchema,
    UpdateUserRoleBodySchema,
} from "@repo/shared";
import { requireAdmin } from "../auth/auth.middleware";
import { AdminErrors } from "./admin.errors";
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
        UpdateUserRoleBody: UpdateUserRoleBodySchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .onError(({ code, status }) => {
        if (code === "VALIDATION" || code === "PARSE") {
            return status(400, { error: "Invalid request data" });
        }
        if (code === 401) {
            return status(401, { error: "Unauthorized" });
        }
        if (code === "INTERNAL_SERVER_ERROR" || code === "UNKNOWN") {
            return status(500, { error: "Internal server error" });
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
                        role: query.role,
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
            .patch(
                "/users/:id/role",
                async ({ user, params, body, status }) => {
                    try {
                        return await AdminService.setUserRole({
                            actorId: user.id,
                            targetUserId: params.id,
                            newRole: body.role,
                        });
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        if (message === AdminErrors.UserNotFound) {
                            return status(404, { error: "User not found" });
                        }
                        if (message === AdminErrors.CannotDemoteSelf) {
                            return status(409, {
                                error: "An admin cannot demote themselves",
                            });
                        }

                        return status(500, {
                            error: "Failed to update user role",
                        });
                    }
                },
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
    );
