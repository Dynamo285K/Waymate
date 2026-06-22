import { Elysia } from "elysia";
import { requireAdmin } from "../auth/auth.middleware";
import { createErrorHandler } from "../auth/auth.errors";
import { AdminError, adminErrorToHttpStatus } from "./admin.errors";
import { AdminDashboardRoutes } from "./dashboard/admin-dashboard.routes";
import { AdminUserRoutes } from "./users/admin-user.routes";
import { AdminRideRoutes } from "./rides/admin-ride.routes";
import { AdminReviewRoutes } from "./reviews/admin-review.routes";
import { AdminReportRoutes } from "./reports/admin-report.routes";

export const AdminRoutes = new Elysia({
    prefix: "/admin",
    tags: ["Admin"],
})
    .onError(createErrorHandler(AdminError, adminErrorToHttpStatus))
    .use(requireAdmin)
    .guard({ auth: true, admin: true }, (app) =>
        app
            .use(AdminDashboardRoutes)
            .use(AdminUserRoutes)
            .use(AdminRideRoutes)
            .use(AdminReviewRoutes)
            .use(AdminReportRoutes)
    );
