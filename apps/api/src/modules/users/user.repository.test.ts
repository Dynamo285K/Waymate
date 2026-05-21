import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { UserRepository } from "./user.repository";

const THROTTLE_MS = 5 * 60 * 1000;

async function insertUser(lastActiveAt: Date | null) {
    const [user] = await db
        .insert(users)
        .values({
            name: "Touch Test User",
            email: `touch-${crypto.randomUUID()}@example.com`,
            lastActiveAt,
        })
        .returning();
    if (!user) throw new Error("Failed to insert test user");
    return user;
}

describe("UserRepository.touchLastActiveAt", () => {
    it("sets last_active_at when it was never set", async () => {
        const user = await insertUser(null);
        const now = new Date();

        await UserRepository.touchLastActiveAt(
            db,
            user.id,
            now,
            THROTTLE_MS
        );

        const updated = await db.query.users.findFirst({
            where: eq(users.id, user.id),
        });
        expect(updated!.lastActiveAt?.getTime()).toBe(now.getTime());
    });

    it("does not rewrite last_active_at within the throttle window", async () => {
        // Active 1 minute ago — well inside the 5-minute window.
        const recent = new Date(Date.now() - 60 * 1000);
        const user = await insertUser(recent);
        const now = new Date();

        await UserRepository.touchLastActiveAt(
            db,
            user.id,
            now,
            THROTTLE_MS
        );

        const updated = await db.query.users.findFirst({
            where: eq(users.id, user.id),
        });
        // Untouched — still the original recent timestamp.
        expect(updated!.lastActiveAt?.getTime()).toBe(recent.getTime());
    });

    it("refreshes last_active_at once it is older than the throttle window", async () => {
        // Active 10 minutes ago — past the 5-minute window.
        const stale = new Date(Date.now() - 10 * 60 * 1000);
        const user = await insertUser(stale);
        const now = new Date();

        await UserRepository.touchLastActiveAt(
            db,
            user.id,
            now,
            THROTTLE_MS
        );

        const updated = await db.query.users.findFirst({
            where: eq(users.id, user.id),
        });
        expect(updated!.lastActiveAt?.getTime()).toBe(now.getTime());
    });

    it("does not touch a soft-deleted user", async () => {
        const user = await insertUser(null);
        await db
            .update(users)
            .set({ deletedAt: new Date() })
            .where(eq(users.id, user.id));

        await UserRepository.touchLastActiveAt(
            db,
            user.id,
            new Date(),
            THROTTLE_MS
        );

        const updated = await db.query.users.findFirst({
            where: eq(users.id, user.id),
        });
        expect(updated!.lastActiveAt).toBeNull();
    });
});
