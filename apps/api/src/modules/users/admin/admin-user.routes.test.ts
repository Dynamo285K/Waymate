import { describe, expect, it } from "vitest";
import { jsonRequest } from "../../../../test/http";
import {
    createSignedInUser,
    authenticatedRequest,
} from "../../../../test/auth-helpers";
import { createTestUser } from "../../../../test/factories";
import { db } from "../../../db";
import { userStatusHistory } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";

describe("AdminUserRoutes", () => {
    describe("Users Moderation", () => {
        it("GET /users/admin lists users", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const response = await authenticatedRequest(
                "/users/admin?limit=10",
                cookie
            );
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(Array.isArray(data.items)).toBe(true);
        });

        it("GET /users/admin/:id returns user details", async () => {
            const { cookie } = await createSignedInUser({ role: "ADMIN" });
            const testUser = await createTestUser({
                name: "Admin Test Target",
            });

            const response = await authenticatedRequest(
                `/users/admin/${testUser.id}`,
                cookie
            );
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.user.id).toBe(testUser.id);
        });

        it("PATCH /users/admin/:id/status successfully updates user status", async () => {
            const { user: adminUser, cookie } = await createSignedInUser({
                role: "ADMIN",
            });
            const testUser = await createTestUser();

            const response = await authenticatedRequest(
                `/users/admin/${testUser.id}/status`,
                cookie,
                jsonRequest(
                    {
                        status: "SUSPENDED",
                        reason: "Violation of terms",
                    },
                    "PATCH"
                )
            );

            expect(response.status).toBe(200);

            const history = await db.query.userStatusHistory.findFirst({
                where: eq(userStatusHistory.userId, testUser.id),
                orderBy: desc(userStatusHistory.createdAt),
            });
            expect(history).toBeDefined();
            expect(history!.newStatus).toBe("SUSPENDED");
            expect(history!.reason).toBe("Violation of terms");
            expect(history!.changedByUserId).toBe(adminUser.id);
        });
    });
});
