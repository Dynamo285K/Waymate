import { Elysia } from "elysia";
import {
    AdminReportIdParamsSchema,
    AdminReportListQuerySchema,
    AdminReportListItemSchema,
    AdminReportListResponseSchema,
    AdminReportDetailSchema,
    AdminReportStatusHistoryItemSchema,
    AdminReportDetailResponseSchema,
    AdminReportConversationSchema,
    UpdateReportStatusBodySchema,
    ErrorResponseSchema,
} from "@repo/shared";
import { AdminReportService } from "./admin-report.service";
import { requireAdmin } from "../../auth/auth.middleware";

export const AdminReportRoutes = new Elysia()
    .use(requireAdmin)
    .model({
        AdminReportIdParams: AdminReportIdParamsSchema,
        AdminReportListQuery: AdminReportListQuerySchema,
        AdminReportListItem: AdminReportListItemSchema,
        AdminReportListResponse: AdminReportListResponseSchema,
        AdminReportDetail: AdminReportDetailSchema,
        AdminReportStatusHistoryItem: AdminReportStatusHistoryItemSchema,
        AdminReportDetailResponse: AdminReportDetailResponseSchema,
        AdminReportConversation: AdminReportConversationSchema,
        UpdateReportStatusBody: UpdateReportStatusBodySchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .guard({ auth: true, admin: true }, (app) =>
        app
            .get(
                "/reports",
                async ({ query }) => {
                    return await AdminReportService.getReportList({
                        limit: query.limit,
                        cursor: query.cursor,
                        status: query.status,
                        reportType: query.reportType,
                        search: query.search,
                    });
                },
                {
                    query: AdminReportListQuerySchema,
                    response: {
                        200: "AdminReportListResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns a keyset-paginated list of user reports for moderation. Supports filtering by status, type, and case-insensitive search across description and reporter/target email/name.",
                    },
                }
            )
            .get(
                "/reports/:id",
                async ({ params }) =>
                    await AdminReportService.getReportDetail(params.id),
                {
                    params: AdminReportIdParamsSchema,
                    response: {
                        200: "AdminReportDetailResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns full report detail (reporter, target, ride context if present, resolution reason) plus the status history (newest first, capped at 50).",
                    },
                }
            )
            .get(
                "/reports/:id/conversation",
                async ({ user, params }) =>
                    await AdminReportService.getReportConversation(
                        params.id,
                        user.id
                    ),
                {
                    params: AdminReportIdParamsSchema,
                    response: {
                        200: "AdminReportConversation",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns the read-only chat between a report's reporter and target (the booking-scoped conversation on the report's ride) for moderation context. `available` is false when the report has no ride or the two never opened a chat. Admin access is audit-logged.",
                    },
                }
            )
            .patch(
                "/reports/:id/status",
                async ({ user, params, body }) =>
                    await AdminReportService.setReportStatus({
                        actorId: user.id,
                        reportId: params.id,
                        newStatus: body.status,
                        reason: body.reason,
                    }),
                {
                    params: AdminReportIdParamsSchema,
                    body: "UpdateReportStatusBody",
                    response: {
                        200: "AdminReportDetailResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Moves a report through its workflow: OPEN→INVESTIGATING (no reason), OPEN/INVESTIGATING→RESOLVED or DISMISSED (reason required). RESOLVED and DISMISSED are terminal. Records an audit row in report_status_history with the admin as changedByUserId.",
                    },
                }
            )
    );
