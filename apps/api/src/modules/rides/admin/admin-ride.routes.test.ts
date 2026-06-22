import { describe, expect, it } from "vitest";
import { jsonRequest } from "../../../../test/http";
import {
    createSignedInUser,
    authenticatedRequest,
} from "../../../../test/auth-helpers";
import { createRideContext } from "../../../../test/factories";
import { db } from "../../../db";
import { rideStatusHistory } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

describe("AdminRideRoutes", () => {
    describe("Rides Management", () => {
        it("GET /rides/admin lists rides", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest(
                "/rides/admin?limit=10",
                cookie
            );
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.items)).toBe(true);
        });

        it("GET /rides/admin/:id returns ride details", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const ctx = await createRideContext();

            const response = await authenticatedRequest(
                `/rides/admin/${ctx.rideId}`,
                cookie
            );
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.ride.id).toBe(ctx.rideId);
            expect(data.ride.driver.id).toBe(ctx.driver.id);
        });

        it("PATCH /rides/admin/:id/cancel forcefully cancels a ride", async () => {
            const { user: adminUser, cookie } = await createSignedInUser({
                role: "ADMIN",
            });
            const ctx = await createRideContext({ rideStatus: "PLANNED" });

            const response = await authenticatedRequest(
                `/rides/admin/${ctx.rideId}/cancel`,
                cookie,
                jsonRequest(
                    {
                        reason: "Administrative cancellation",
                    },
                    "PATCH"
                )
            );

            expect(response.status).toBe(200);

            const history = await db.query.rideStatusHistory.findFirst({
                where: eq(rideStatusHistory.rideId, ctx.rideId),
                orderBy: desc(rideStatusHistory.createdAt),
            });
            expect(history).toBeDefined();
            expect(history!.newStatus).toBe("CANCELLED");
            expect(history!.reason).toBe("Administrative cancellation");
            expect(history!.changedByUserId).toBe(adminUser.id);
        });
    });
});
