import { describe, expect, it } from "vitest";
import { jsonRequest } from "../../../../test/http";
import {
    createSignedInUser,
    authenticatedRequest,
} from "../../../../test/auth-helpers";
import { createRideContext } from "../../../../test/factories";
import { db } from "../../../db";
import { reviews, reviewStatusHistory } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

describe("AdminReviewRoutes", () => {
    describe("Reviews Moderation", () => {
        async function createTestReview(
            status: "VISIBLE" | "HIDDEN" | "REMOVED" = "VISIBLE"
        ) {
            const ctx = await createRideContext({
                withPassenger: true,
                rideStatus: "COMPLETED",
            });
            const [review] = await db
                .insert(reviews)
                .values({
                    rideId: ctx.rideId,
                    authorId: ctx.passenger!.id,
                    subjectId: ctx.driver.id,
                    rating: 5,
                    comment: "Great driver!",
                    reviewStatus: status,
                })
                .returning();
            return review!;
        }

        it("GET /reviews/admin lists reviews", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest(
                "/reviews/admin?limit=10",
                cookie
            );
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.items)).toBe(true);
        });

        it("GET /reviews/admin/counts returns moderation badges", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest(
                "/reviews/admin/counts",
                cookie
            );
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty("all");
            expect(data).toHaveProperty("visible");
            expect(data).toHaveProperty("hidden");
        });

        it("GET /reviews/admin/:id returns review details", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const review = await createTestReview();

            const response = await authenticatedRequest(
                `/reviews/admin/${review.id}`,
                cookie
            );
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.review.id).toBe(review.id);
        });

        it("PATCH /reviews/admin/:id/status updates review status", async () => {
            const { user: adminUser, cookie } = await createSignedInUser({
                role: "ADMIN",
            });
            const review = await createTestReview();

            const response = await authenticatedRequest(
                `/reviews/admin/${review.id}/status`,
                cookie,
                jsonRequest(
                    {
                        status: "HIDDEN",
                        reason: "Inappropriate language",
                    },
                    "PATCH"
                )
            );

            expect(response.status).toBe(200);

            const history = await db.query.reviewStatusHistory.findFirst({
                where: eq(reviewStatusHistory.reviewId, review.id),
                orderBy: desc(reviewStatusHistory.createdAt),
            });
            expect(history).toBeDefined();
            expect(history!.newStatus).toBe("HIDDEN");
            expect(history!.reason).toBe("Inappropriate language");
            expect(history!.changedByUserId).toBe(adminUser.id);
        });

        it("DELETE /reviews/admin/:id soft deletes a review", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const review = await createTestReview();

            const response = await authenticatedRequest(
                `/reviews/admin/${review.id}`,
                cookie,
                { method: "DELETE" }
            );
            expect(response.status).toBe(200);

            const dbReview = await db.query.reviews.findFirst({
                where: eq(reviews.id, review.id),
            });
            expect(dbReview!.deletedAt).not.toBeNull();
        });
    });
});
