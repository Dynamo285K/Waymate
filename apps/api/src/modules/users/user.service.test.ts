import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { UserService } from "./user.service";
import { UserError, UserErrorCodes } from "./user.errors";

async function insertTestUser(
    overrides: Partial<typeof users.$inferInsert> = {}
) {
    const [user] = await db
        .insert(users)
        .values({
            name: overrides.name ?? "Test User",
            email: overrides.email ?? `test-${crypto.randomUUID()}@example.com`,
            firstName: overrides.firstName ?? null,
            lastName: overrides.lastName ?? null,
            displayName: overrides.displayName ?? null,
            phone: overrides.phone ?? null,
            bio: overrides.bio ?? null,
            profilePhotoUrl: overrides.profilePhotoUrl ?? null,
            userRole: overrides.userRole ?? "USER",
            banned: overrides.banned ?? false,
            banReason: overrides.banReason ?? null,
            banExpires: overrides.banExpires ?? null,
            deletedAt: overrides.deletedAt ?? null,
        })
        .returning();
    if (!user) throw new Error("Failed to insert test user");
    return user;
}

describe("UserService.getUserById", () => {
    it("returns the user when found", async () => {
        const user = await insertTestUser({ name: "Alice Example" });

        const result = await UserService.getUserById(user.id);

        expect(result.id).toBe(user.id);
        expect(result.email).toBe(user.email);
        expect(result.name).toBe("Alice Example");
    });

    it("strips the better-auth admin-plugin fields (banned/banReason/banExpires)", async () => {
        const user = await insertTestUser({
            banned: true,
            banReason: "test reason",
            banExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        const result = await UserService.getUserById(user.id);

        // The Service strips these so /users/me responses don't leak them.
        expect(result).not.toHaveProperty("banned");
        expect(result).not.toHaveProperty("banReason");
        expect(result).not.toHaveProperty("banExpires");
    });

    it("throws UserNotFound for an unknown id", async () => {
        await expect(
            UserService.getUserById(crypto.randomUUID())
        ).rejects.toMatchObject({ code: UserErrorCodes.UserNotFound });
    });

    it("throws UserNotFound for a soft-deleted user", async () => {
        const user = await insertTestUser({ deletedAt: new Date() });

        await expect(UserService.getUserById(user.id)).rejects.toMatchObject({
            code: UserErrorCodes.UserNotFound,
        });
    });
});

describe("UserService.onboardUser", () => {
    it("sets firstName, lastName, and phone on the user", async () => {
        const user = await insertTestUser();

        const result = await UserService.onboardUser(user.id, {
            firstName: "Alice",
            lastName: "Example",
            phone: "+421900000000",
        });

        expect(result.firstName).toBe("Alice");
        expect(result.lastName).toBe("Example");
        expect(result.phone).toBe("+421900000000");

        // Persisted, not just returned.
        const refetched = await db.query.users.findFirst({
            where: eq(users.id, user.id),
        });
        expect(refetched!.firstName).toBe("Alice");
        expect(refetched!.lastName).toBe("Example");
        expect(refetched!.phone).toBe("+421900000000");
    });

    it("strips admin-plugin fields from its response too", async () => {
        const user = await insertTestUser({ banned: true });

        const result = await UserService.onboardUser(user.id, {
            firstName: "Bob",
            lastName: "Example",
            phone: "+421911222333",
        });

        expect(result).not.toHaveProperty("banned");
    });

    it("throws UserNotFound for an unknown id", async () => {
        await expect(
            UserService.onboardUser(crypto.randomUUID(), {
                firstName: "Alice",
                lastName: "Example",
                phone: "+421900000000",
            })
        ).rejects.toMatchObject({ code: UserErrorCodes.UserNotFound });
    });

    it("throws UserNotFound for a soft-deleted user (UPDATE … WHERE deleted_at IS NULL)", async () => {
        const user = await insertTestUser({ deletedAt: new Date() });

        await expect(
            UserService.onboardUser(user.id, {
                firstName: "Alice",
                lastName: "Example",
                phone: "+421900000000",
            })
        ).rejects.toMatchObject({ code: UserErrorCodes.UserNotFound });
    });
});

describe("UserService.updateUserProfile", () => {
    it("updates only the keys that were passed in", async () => {
        const user = await insertTestUser({
            firstName: "Alice",
            lastName: "Example",
            phone: "+421900000000",
            bio: "Old bio",
        });

        const result = await UserService.updateUserProfile(user.id, {
            bio: "Fresh bio",
        });

        expect(result.bio).toBe("Fresh bio");
        // The fields we didn't pass must remain intact.
        expect(result.firstName).toBe("Alice");
        expect(result.lastName).toBe("Example");
        expect(result.phone).toBe("+421900000000");
    });

    it("can set displayName and profilePhotoUrl together", async () => {
        const user = await insertTestUser();

        const result = await UserService.updateUserProfile(user.id, {
            displayName: "alice",
            profilePhotoUrl: "https://example.com/photo.jpg",
        });

        expect(result.displayName).toBe("alice");
        expect(result.profilePhotoUrl).toBe("https://example.com/photo.jpg");
    });

    it("throws UserNotFound for an unknown id", async () => {
        await expect(
            UserService.updateUserProfile(crypto.randomUUID(), {
                bio: "Whatever",
            })
        ).rejects.toMatchObject({ code: UserErrorCodes.UserNotFound });
    });

    it("throws UserNotFound for a soft-deleted user", async () => {
        const user = await insertTestUser({ deletedAt: new Date() });

        await expect(
            UserService.updateUserProfile(user.id, { bio: "Won't land" })
        ).rejects.toMatchObject({ code: UserErrorCodes.UserNotFound });
    });
});

void UserError;
