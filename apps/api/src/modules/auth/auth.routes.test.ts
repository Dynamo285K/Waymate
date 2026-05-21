import { describe, expect, it } from "vitest";
import { db } from "../../db";
import { accounts, users } from "../../db/schema";
import { apiRequest } from "../../../test/http";
import { auth } from "./auth";

async function insertCredentialUser(
    overrides: Partial<typeof users.$inferInsert> = {}
) {
    const email =
        overrides.email ?? `banned-${crypto.randomUUID()}@example.com`;
    const password = "password123";

    const [user] = await db
        .insert(users)
        .values({
            name: overrides.name ?? "Blocked User",
            email,
            emailVerified: true,
            firstName: "Blocked",
            lastName: "User",
            phone: "+421900000003",
            userStatus: overrides.userStatus ?? "BANNED",
            banned: overrides.banned ?? true,
            banReason: overrides.banReason ?? "Account banned",
        })
        .returning();

    if (!user) throw new Error("Failed to insert credential user");

    const authContext = await auth.$context;
    await db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: await authContext.password.hash(password),
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return { email, password };
}

describe("Auth routes", () => {
    it("rejects email sign-in for a banned user with USER_BANNED", async () => {
        const credentials = await insertCredentialUser({
            banReason: "Policy violation",
        });

        const response = await apiRequest("/api/auth/sign-in/email", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(credentials),
        });

        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toMatchObject({
            code: "USER_BANNED",
            message: "Policy violation",
        });
    });

    it("rejects email sign-in for a suspended user with USER_SUSPENDED", async () => {
        // userStatus SUSPENDED with banned=false — the suspend path is distinct
        // from the better-auth `banned` flag and must be enforced on its own.
        const credentials = await insertCredentialUser({
            userStatus: "SUSPENDED",
            banned: false,
        });

        const response = await apiRequest("/api/auth/sign-in/email", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(credentials),
        });

        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toMatchObject({
            code: "USER_SUSPENDED",
            message: "This account has been suspended.",
        });
    });
});
