import { Elysia } from "elysia";
import {
    AdminReviewIdParamsSchema,
    AdminReviewListQuerySchema,
    AdminReviewListItemSchema,
    AdminReviewListResponseSchema,
    AdminReviewCountsSchema,
    AdminDeleteReviewResponseSchema,
    AdminReviewDetailSchema,
    AdminReviewStatusHistoryItemSchema,
    AdminReviewDetailResponseSchema,
    UpdateReviewStatusBodySchema,
    ErrorResponseSchema,
} from "@repo/shared";
import { AdminReviewService } from "./admin-review.service";
import { requireAdmin } from "../../auth/auth.middleware";

export const AdminReviewRoutes = new Elysia()
    .use(requireAdmin)
    .model({
        AdminReviewIdParams: AdminReviewIdParamsSchema,
        AdminReviewListQuery: AdminReviewListQuerySchema,
        AdminReviewListItem: AdminReviewListItemSchema,
        AdminReviewListResponse: AdminReviewListResponseSchema,
        AdminReviewCounts: AdminReviewCountsSchema,
        AdminDeleteReviewResponse: AdminDeleteReviewResponseSchema,
        AdminReviewDetail: AdminReviewDetailSchema,
        AdminReviewStatusHistoryItem: AdminReviewStatusHistoryItemSchema,
        AdminReviewDetailResponse: AdminReviewDetailResponseSchema,
        UpdateReviewStatusBody: UpdateReviewStatusBodySchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .guard({ auth: true, admin: true }, (app) =>
        app
            .get(
                "/reviews",
                async ({ query }) => {
                    return await AdminReviewService.getReviewList({
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
                "/reviews/counts",
                async () => await AdminReviewService.getReviewCounts(),
                {
                    response: {
                        200: "AdminReviewCounts",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns counts of non-deleted reviews grouped by status (all, visible, hidden) for admin tab badges.",
                    },
                }
            )
            .delete(
                "/reviews/:id",
                async ({ params }) =>
                    await AdminReviewService.deleteReview(params.id),
                {
                    params: AdminReviewIdParamsSchema,
                    response: {
                        200: "AdminDeleteReviewResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Permanently soft-deletes a review. The review is removed from all public surfaces and excluded from rating aggregates.",
                    },
                }
            )
            .get(
                "/reviews/:id",
                async ({ params }) =>
                    await AdminReviewService.getReviewDetail(params.id),
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
                    await AdminReviewService.setReviewStatus({
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
    );
