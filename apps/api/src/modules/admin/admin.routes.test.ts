import { describe, expect, it } from "vitest";
import { apiRequest, jsonRequest } from "../../../test/http";
import { createSignedInUser, authenticatedRequest } from "../../../test/auth-helpers";
import { createRideContext, createTestUser } from "../../../test/factories";
import { db } from "../../db";
import { reviews, reports, rides as ridesTable, userStatusHistory, rideStatusHistory, reviewStatusHistory, reportStatusHistory } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

describe("AdminRoutes", () => {
    describe("Authorization & Role Guards", () => {
        it("returns 401 UNAUTHORIZED without a session", async () => {
            const response = await apiRequest("/admin/dashboard");
            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({ error: "UNAUTHORIZED" });
        });

        it("returns 403 FORBIDDEN for standard users", async () => {
            const { cookie } = await createSignedInUser({ role: "USER" });
            const response = await authenticatedRequest("/admin/dashboard", cookie);
            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toEqual({ error: "FORBIDDEN" });
        });
    });

    describe("Dashboard", () => {
        it("returns 200 OK and dashboard statistics for an admin", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest("/admin/dashboard", cookie);
            expect(response.status).toBe(200);
            
            const data = await response.json();
            // Verify basic shape
            expect(data).toHaveProperty("weeklyRides");
            expect(data).toHaveProperty("weeklyRevenue");
            expect(data).toHaveProperty("popularRoutes");
            expect(data).toHaveProperty("userMetrics");
        });
    });

    describe("Users Moderation", () => {
        it("GET /admin/users lists users", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest("/admin/users?limit=10", cookie);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.items)).toBe(true);
        });

        it("GET /admin/users/:id returns user details", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const testUser = await createTestUser({ name: "Admin Test Target" });

            const response = await authenticatedRequest(`/admin/users/${testUser.id}`, cookie);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.user.id).toBe(testUser.id);
        });

        it("PATCH /admin/users/:id/status successfully updates user status", async () => {
            const { user: adminUser, cookie } = await createSignedInUser({ role: "ADMIN" });
            const testUser = await createTestUser();

            const response = await authenticatedRequest(`/admin/users/${testUser.id}/status`, cookie, jsonRequest({
                status: "SUSPENDED",
                reason: "Violation of terms"
            }, "PATCH"));
            
            expect(response.status).toBe(200);
            
            const history = await db.query.userStatusHistory.findFirst({
                where: eq(userStatusHistory.userId, testUser.id),
                orderBy: desc(userStatusHistory.createdAt)
            });
            expect(history).toBeDefined();
            expect(history!.newStatus).toBe("SUSPENDED");
            expect(history!.reason).toBe("Violation of terms");
            expect(history!.changedByUserId).toBe(adminUser.id);
        });
    });

    describe("Rides Management", () => {
        it("GET /admin/rides lists rides", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest("/admin/rides?limit=10", cookie);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.items)).toBe(true);
        });

        it("GET /admin/rides/:id returns ride details", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const ctx = await createRideContext();

            const response = await authenticatedRequest(`/admin/rides/${ctx.rideId}`, cookie);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.ride.id).toBe(ctx.rideId);
            expect(data.ride.driver.id).toBe(ctx.driver.id);
        });

        it("PATCH /admin/rides/:id/cancel forcefully cancels a ride", async () => {
            const { user: adminUser, cookie } = await createSignedInUser({ role: "ADMIN" });
            const ctx = await createRideContext({ rideStatus: "PLANNED" });

            const response = await authenticatedRequest(`/admin/rides/${ctx.rideId}/cancel`, cookie, jsonRequest({
                reason: "Administrative cancellation"
            }, "PATCH"));
            
            expect(response.status).toBe(200);

            const history = await db.query.rideStatusHistory.findFirst({
                where: eq(rideStatusHistory.rideId, ctx.rideId),
                orderBy: desc(rideStatusHistory.createdAt)
            });
            expect(history).toBeDefined();
            expect(history!.newStatus).toBe("CANCELLED");
            expect(history!.reason).toBe("Administrative cancellation");
            expect(history!.changedByUserId).toBe(adminUser.id);
        });
    });

    describe("Reviews Moderation", () => {
        async function createTestReview(status: "VISIBLE" | "HIDDEN" | "REMOVED" = "VISIBLE") {
            const ctx = await createRideContext({ withPassenger: true, rideStatus: "COMPLETED" });
            const [review] = await db.insert(reviews).values({
                rideId: ctx.rideId,
                authorId: ctx.passenger!.id,
                subjectId: ctx.driver.id,
                rating: 5,
                comment: "Great driver!",
                reviewStatus: status
            }).returning();
            return review!;
        }

        it("GET /admin/reviews lists reviews", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest("/admin/reviews?limit=10", cookie);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.items)).toBe(true);
        });

        it("GET /admin/reviews/counts returns moderation badges", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest("/admin/reviews/counts", cookie);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty("all");
            expect(data).toHaveProperty("visible");
            expect(data).toHaveProperty("hidden");
        });

        it("GET /admin/reviews/:id returns review details", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const review = await createTestReview();

            const response = await authenticatedRequest(`/admin/reviews/${review.id}`, cookie);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.review.id).toBe(review.id);
        });

        it("PATCH /admin/reviews/:id/status updates review status", async () => {
            const { user: adminUser, cookie } = await createSignedInUser({ role: "ADMIN" });
            const review = await createTestReview();

            const response = await authenticatedRequest(`/admin/reviews/${review.id}/status`, cookie, jsonRequest({
                status: "HIDDEN",
                reason: "Inappropriate language"
            }, "PATCH"));
            
            expect(response.status).toBe(200);

            const history = await db.query.reviewStatusHistory.findFirst({
                where: eq(reviewStatusHistory.reviewId, review.id),
                orderBy: desc(reviewStatusHistory.createdAt)
            });
            expect(history).toBeDefined();
            expect(history!.newStatus).toBe("HIDDEN");
            expect(history!.reason).toBe("Inappropriate language");
            expect(history!.changedByUserId).toBe(adminUser.id);
        });

        it("DELETE /admin/reviews/:id soft deletes a review", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const review = await createTestReview();

            const response = await authenticatedRequest(`/admin/reviews/${review.id}`, cookie, { method: "DELETE" });
            expect(response.status).toBe(200);

            const dbReview = await db.query.reviews.findFirst({
                where: eq(reviews.id, review.id)
            });
            expect(dbReview!.deletedAt).not.toBeNull();
        });
    });

    describe("Reports Moderation", () => {
        async function createTestReport(status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "DISMISSED" = "OPEN") {
            const reporter = await createTestUser();
            const target = await createTestUser();
            const [report] = await db.insert(reports).values({
                reporterId: reporter.id,
                targetUserId: target.id,
                reportType: "OTHER",
                description: "Test report",
                reportStatus: status
            }).returning();
            return report!;
        }

        it("GET /admin/reports lists reports", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest("/admin/reports?limit=10", cookie);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.items)).toBe(true);
        });

        it("GET /admin/reports/:id returns report details", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const report = await createTestReport();

            const response = await authenticatedRequest(`/admin/reports/${report.id}`, cookie);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.report.id).toBe(report.id);
        });

        it("PATCH /admin/reports/:id/status updates report status", async () => {
            const { user: adminUser, cookie } = await createSignedInUser({ role: "ADMIN" });
            const report = await createTestReport();

            const response = await authenticatedRequest(`/admin/reports/${report.id}/status`, cookie, jsonRequest({
                status: "RESOLVED",
                reason: "Action taken"
            }, "PATCH"));
            
            expect(response.status).toBe(200);

            const history = await db.query.reportStatusHistory.findFirst({
                where: eq(reportStatusHistory.reportId, report.id),
                orderBy: desc(reportStatusHistory.createdAt)
            });
            expect(history).toBeDefined();
            expect(history!.newStatus).toBe("RESOLVED");
            expect(history!.reason).toBe("Action taken");
            expect(history!.changedByUserId).toBe(adminUser.id);
        });
    });
});
