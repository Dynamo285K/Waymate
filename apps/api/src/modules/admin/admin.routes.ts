import { Elysia } from "elysia";
import {
    AdminCancelRideBodySchema,
    AdminCancelRideResponseSchema,
    AdminReviewDetailResponseSchema,
    AdminReviewDetailSchema,
    AdminReviewIdParamsSchema,
    AdminReviewListItemSchema,
    AdminReviewListQuerySchema,
    AdminReviewListResponseSchema,
    AdminReviewStatusHistoryItemSchema,
    AdminRideDetailResponseSchema,
    AdminRideDetailSchema,
    AdminRideIdParamsSchema,
    AdminRideListItemSchema,
    AdminRideListQuerySchema,
    AdminRideListResponseSchema,
    AdminRideStatusHistoryItemSchema,
    AdminUserDetailResponseSchema,
    AdminUserDetailSchema,
    AdminUserIdParamsSchema,
    AdminUserListItemSchema,
    AdminUserListQuerySchema,
    AdminUserListResponseSchema,
    AdminUserStatusHistoryItemSchema,
    ErrorResponseSchema,
    UpdateReviewStatusBodySchema,
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
        AdminRideIdParams: AdminRideIdParamsSchema,
        AdminRideListQuery: AdminRideListQuerySchema,
        AdminRideListItem: AdminRideListItemSchema,
        AdminRideListResponse: AdminRideListResponseSchema,
        AdminRideDetail: AdminRideDetailSchema,
        AdminRideStatusHistoryItem: AdminRideStatusHistoryItemSchema,
        AdminRideDetailResponse: AdminRideDetailResponseSchema,
        AdminCancelRideBody: AdminCancelRideBodySchema,
        AdminCancelRideResponse: AdminCancelRideResponseSchema,
        AdminReviewIdParams: AdminReviewIdParamsSchema,
        AdminReviewListQuery: AdminReviewListQuerySchema,
        AdminReviewListItem: AdminReviewListItemSchema,
        AdminReviewListResponse: AdminReviewListResponseSchema,
        AdminReviewDetail: AdminReviewDetailSchema,
        AdminReviewStatusHistoryItem: AdminReviewStatusHistoryItemSchema,
        AdminReviewDetailResponse: AdminReviewDetailResponseSchema,
        UpdateReviewStatusBody: UpdateReviewStatusBodySchema,
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
                    await AdminService.getUserDetail(params.id),
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
            .get(
                "/rides",
                async ({ query }) => {
                    return await AdminService.getRideList({
                        limit: query.limit,
                        cursor: query.cursor,
                        status: query.status,
                        search: query.search,
                    });
                },
                {
                    query: AdminRideListQuerySchema,
                    response: {
                        200: "AdminRideListResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns a keyset-paginated list of rides for admin tooling. Supports filtering by status and case-insensitive driver email/firstName/lastName search.",
                    },
                }
            )
            .get(
                "/rides/:id",
                async ({ params }) =>
                    await AdminService.getRideDetail(params.id),
                {
                    params: AdminRideIdParamsSchema,
                    response: {
                        200: "AdminRideDetailResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns full ride detail (driver, car, stops, prices, bookings) plus the most recent status history entries (newest first, capped at 50). changedBy is null for system-triggered changes.",
                    },
                }
            )
            .get(
                "/reviews",
                async ({ query }) => {
                    return await AdminService.getReviewList({
                        limit: query.limit,
                        cursor: query.cursor,
                        status: query.status,
                        minRating: query.minRating,
                        maxRating: query.maxRating,
                        search: query.search,
                    });
                },
                {
                    query: AdminReviewListQuerySchema,
                    response: {
                        200: "AdminReviewListResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns a keyset-paginated list of reviews for moderation. Supports filtering by status, rating range, and case-insensitive search across comment text and author/subject email/name.",
                    },
                }
            )
            .get(
                "/reviews/:id",
                async ({ params }) =>
                    await AdminService.getReviewDetail(params.id),
                {
                    params: AdminReviewIdParamsSchema,
                    response: {
                        200: "AdminReviewDetailResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns full review detail (author, subject, ride context) plus the most recent status history entries (newest first, capped at 50).",
                    },
                }
            )
            .patch(
                "/reviews/:id/status",
                async ({ user, params, body }) =>
                    await AdminService.setReviewStatus({
                        actorId: user.id,
                        reviewId: params.id,
                        newStatus: body.status,
                        reason: body.reason,
                    }),
                {
                    params: AdminReviewIdParamsSchema,
                    body: "UpdateReviewStatusBody",
                    response: {
                        200: "AdminReviewListItem",
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
                            "Changes a review's moderation status (VISIBLE / HIDDEN / REMOVED) and records an audit row in review_status_history. The reason is required so the moderation log makes the action traceable.",
                    },
                }
            )
            .patch(
                "/rides/:id/cancel",
                async ({ user, params, body }) =>
                    await AdminService.cancelRide({
                        actorId: user.id,
                        rideId: params.id,
                        reason: body.reason,
                    }),
                {
                    params: AdminRideIdParamsSchema,
                    body: "AdminCancelRideBody",
                    response: {
                        200: "AdminCancelRideResponse",
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
                            "Force-cancels a ride as admin and cascades cancellation to all active passenger bookings (PENDING/CONFIRMED). Records an audit row in ride_status_history with the admin as changedByUserId. The reason is required so the audit log makes the override traceable.",
                    },
                }
            )
    );
