import { describe, expect, it } from "vitest";
import { jsonRequest } from "../../../../test/http";
import {
    createSignedInUser,
    authenticatedRequest,
} from "../../../../test/auth-helpers";
import { createTestUser } from "../../../../test/factories";
import { db } from "../../../db";
import { reports, reportStatusHistory } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

describe("AdminReportRoutes", () => {
    describe("Reports Moderation", () => {
        async function createTestReport(
            status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED" = "OPEN"
        ) {
            const reporter = await createTestUser();
            const target = await createTestUser();
            const [report] = await db
                .insert(reports)
                .values({
                    reporterId: reporter.id,
                    targetUserId: target.id,
                    reportType: "OTHER",
                    description: "Test report",
                    reportStatus: status,
                })
                .returning();
            return report!;
        }

        it("GET /reports/admin lists reports", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest(
                "/reports/admin?limit=10",
                cookie
            );
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.items)).toBe(true);
        });

        it("GET /reports/admin/:id returns report details", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const report = await createTestReport();

            const response = await authenticatedRequest(
                `/reports/admin/${report.id}`,
                cookie
            );
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.report.id).toBe(report.id);
        });

        it("PATCH /reports/admin/:id/status updates report status", async () => {
            const { user: adminUser, cookie } = await createSignedInUser({
                role: "ADMIN",
            });
            const report = await createTestReport();

            const response = await authenticatedRequest(
                `/reports/admin/${report.id}/status`,
                cookie,
                jsonRequest(
                    {
                        status: "RESOLVED",
                        reason: "Action taken",
                    },
                    "PATCH"
                )
            );

            expect(response.status).toBe(200);

            const history = await db.query.reportStatusHistory.findFirst({
                where: eq(reportStatusHistory.reportId, report.id),
                orderBy: desc(reportStatusHistory.createdAt),
            });
            expect(history).toBeDefined();
            expect(history!.newStatus).toBe("RESOLVED");
            expect(history!.reason).toBe("Action taken");
            expect(history!.changedByUserId).toBe(adminUser.id);
        });
    });
});
