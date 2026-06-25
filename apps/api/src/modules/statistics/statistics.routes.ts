import { Elysia } from "elysia";
import {
    AdminDashboardResponseSchema,
    ErrorResponseSchema,
} from "@repo/shared";
import { StatisticsService } from "./statistics.service";
import { requireAdmin } from "../auth/auth.middleware";

export const StatisticsRoutes = new Elysia({ prefix: "/admin" })
    .use(requireAdmin)
    .model({
        AdminDashboardResponse: AdminDashboardResponseSchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .guard({ auth: true, admin: true }, (app) =>
        app.get(
            "/dashboard",
            async () => await StatisticsService.getDashboard(),
            {
                response: {
                    200: "AdminDashboardResponse",
                    401: "ErrorResponse",
                    403: "ErrorResponse",
                    429: "ErrorResponse",
                    500: "ErrorResponse",
                },
                detail: {
                    description:
                        "Returns aggregated platform statistics for the admin dashboard: weekly ride/revenue charts, popular routes, and user metrics.",
                },
            }
        )
    );
