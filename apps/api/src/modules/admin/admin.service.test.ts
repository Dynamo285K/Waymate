import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { sessions, users } from "../../db/schema";
import { AdminService } from "./admin.service";

async function insertAdminUser() {
    const [user] = await db
        .insert(users)
        .values({
            name: "Admin User",
            email: `admin-${crypto.randomUUID()}@example.com`,
            emailVerified: true,
            firstName: "Admin",
            lastName: "User",
            phone: "+421900000001",
            userRole: "ADMIN",
        })
        .returning();

    if (!user) throw new Error("Failed to insert admin user");
    return user;
}

async function insertRegularUser(
    overrides: Partial<typeof users.$inferInsert> = {}
) {
    const [user] = await db
        .insert(users)
        .values({
            name: overrides.name ?? "Regular User",
            email:
                overrides.email ?? `regular-${crypto.randomUUID()}@example.com`,
            emailVerified: overrides.emailVerified ?? true,
            firstName: overrides.firstName ?? "Regular",
            lastName: overrides.lastName ?? "User",
            phone: overrides.phone ?? "+421900000002",
            userStatus: overrides.userStatus ?? "ACTIVE",
            banned: overrides.banned ?? false,
            banReason: overrides.banReason ?? null,
            banExpires: overrides.banExpires ?? null,
        })
        .returning();

    if (!user) throw new Error("Failed to insert regular user");
    return user;
}

async function insertSession(userId: string) {
    const [session] = await db
        .insert(sessions)
        .values({
            id: crypto.randomUUID(),
            userId,
            token: crypto.randomUUID(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();

    if (!session) throw new Error("Failed to insert session");
    return session;
}

describe("AdminService.setUserStatus", () => {
    it("syncs a BANNED status to better-auth ban fields and clears sessions", async () => {
        const admin = await insertAdminUser();
        const target = await insertRegularUser();
        await insertSession(target.id);

        await AdminService.setUserStatus({
            actorId: admin.id,
            targetUserId: target.id,
            newStatus: "BANNED",
            reason: "Policy violation",
        });

        const [updated] = await db
            .select({
                userStatus: users.userStatus,
                banned: users.banned,
                banReason: users.banReason,
                banExpires: users.banExpires,
            })
            .from(users)
            .where(eq(users.id, target.id));

        expect(updated).toEqual({
            userStatus: "BANNED",
            banned: true,
            banReason: "Policy violation",
            banExpires: null,
        });

        const remainingSessions = await db
            .select({ id: sessions.id })
            .from(sessions)
            .where(eq(sessions.userId, target.id));
        expect(remainingSessions).toEqual([]);
    });

    it("clears better-auth ban fields when a banned user is reactivated", async () => {
        const admin = await insertAdminUser();
        const target = await insertRegularUser({
            userStatus: "BANNED",
            banned: true,
            banReason: "Old ban",
            banExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        await AdminService.setUserStatus({
            actorId: admin.id,
            targetUserId: target.id,
            newStatus: "ACTIVE",
        });

        const [updated] = await db
            .select({
                userStatus: users.userStatus,
                banned: users.banned,
                banReason: users.banReason,
                banExpires: users.banExpires,
            })
            .from(users)
            .where(eq(users.id, target.id));

        expect(updated).toEqual({
            userStatus: "ACTIVE",
            banned: false,
            banReason: null,
            banExpires: null,
        });
    });
});
