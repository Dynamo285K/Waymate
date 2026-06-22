import { describe, expect, it } from "vitest";
import { apiRequest } from "../../../test/http";
import {
    createSignedInUser,
    authenticatedRequest,
} from "../../../test/auth-helpers";

describe("StatisticsRoutes", () => {
    describe("Authorization & Role Guards", () => {
        it("returns 401 UNAUTHORIZED without a session", async () => {
            const response = await apiRequest("/admin/dashboard");
            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({
                error: "UNAUTHORIZED",
            });
        });

        it("returns 403 FORBIDDEN for standard users", async () => {
            const { cookie } = await createSignedInUser({ role: "USER" });
            const response = await authenticatedRequest(
                "/admin/dashboard",
                cookie
            );
            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toEqual({
                error: "FORBIDDEN",
            });
        });
    });

    describe("Dashboard", () => {
        it("returns 200 OK and dashboard statistics for an admin", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest(
                "/admin/dashboard",
                cookie
            );
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty("weeklyRides");
            expect(data).toHaveProperty("weeklyRevenue");
            expect(data).toHaveProperty("popularRoutes");
            expect(data).toHaveProperty("userMetrics");
        });
    });
});
