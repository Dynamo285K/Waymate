import { Elysia } from "elysia";
import {
    AdminDashboardResponseSchema,
    ErrorResponseSchema,
} from "@repo/shared";
import { AdminDashboardService } from "./admin-dashboard.service";

export const AdminDashboardRoutes = new Elysia()
    .model({
        AdminDashboardResponse: AdminDashboardResponseSchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .get("/dashboard", async () => await AdminDashboardService.getDashboard(), {
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
    });
