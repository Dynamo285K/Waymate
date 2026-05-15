import { Elysia } from "elysia";
import {
    CreateReportBodySchema,
    ErrorResponseSchema,
    ReportActionResponseSchema,
} from "@repo/shared";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { createErrorHandler } from "../auth/auth.errors";
import { ReportError, reportErrorToHttpStatus } from "./report.errors";
import { ReportService } from "./report.service";

export const ReportRoutes = new Elysia({
    prefix: "/reports",
    tags: ["Reports"],
})
    .model({
        CreateReportBody: CreateReportBodySchema,
        ReportActionResponse: ReportActionResponseSchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .onError(createErrorHandler(ReportError, reportErrorToHttpStatus))
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app.post(
            "/",
            async ({ user, body, status }) => {
                const report = await ReportService.submitReport({
                    reporterId: user.id,
                    targetUserId: body.targetUserId,
                    rideId: body.rideId,
                    reportType: body.reportType,
                    description: body.description,
                });

                return status(201, {
                    id: report.id,
                    reportStatus: report.reportStatus,
                });
            },
            {
                body: "CreateReportBody",
                response: {
                    201: "ReportActionResponse",
                    400: "ErrorResponse",
                    403: "ErrorResponse",
                    404: "ErrorResponse",
                    413: "ErrorResponse",
                    429: "ErrorResponse",
                    500: "ErrorResponse",
                },
                detail: {
                    description:
                        "File a moderation report against another user. The reporter must share at least one ride with the target (driver↔passenger, in either direction). Optional rideId carries the context the report was filed from.",
                },
            }
        )
    );
