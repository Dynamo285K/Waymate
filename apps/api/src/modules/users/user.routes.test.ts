import { describe, expect, it } from "vitest";
import { apiRequest, jsonRequest } from "../../../test/http";
import { createSignedInUser, authenticatedRequest } from "../../../test/auth-helpers";

describe("UserRoutes", () => {
    describe("Authorization Guards", () => {
        it("returns 401 UNAUTHORIZED for GET /users/me without a session", async () => {
            const response = await apiRequest("/users/me");
            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({ error: "UNAUTHORIZED" });
        });

        it("returns 401 UNAUTHORIZED for PATCH /users/me/onboarding without a session", async () => {
            const response = await apiRequest("/users/me/onboarding", jsonRequest({
                firstName: "Alice",
                lastName: "Example",
                phone: "+421900123456"
            }, "PATCH"));
            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({ error: "UNAUTHORIZED" });
        });

        it("returns 401 UNAUTHORIZED for PATCH /users/me/profile without a session", async () => {
            const response = await apiRequest("/users/me/profile", jsonRequest({
                bio: "New bio"
            }, "PATCH"));
            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({ error: "UNAUTHORIZED" });
        });
    });

    describe("GET /users/me", () => {
        it("returns the currently authenticated user", async () => {
            const { user, cookie } = await createSignedInUser();

            const response = await authenticatedRequest("/users/me", cookie);
            
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.id).toBe(user.id);
            expect(data.email).toBe(user.email);
            expect(data.name).toBe(user.name);
        });
    });

    describe("PATCH /users/me/onboarding", () => {
        it("returns 400 for invalid body payload", async () => {
            const { cookie } = await createSignedInUser();

            // Missing required fields
            const response = await authenticatedRequest("/users/me/onboarding", cookie, jsonRequest({
                firstName: "Alice",
                // missing lastName and phone
            }, "PATCH"));
            
            expect(response.status).toBe(400);
        });

        it("successfully updates user onboarding fields", async () => {
            const { user, cookie } = await createSignedInUser();

            const response = await authenticatedRequest("/users/me/onboarding", cookie, jsonRequest({
                firstName: "Alice",
                lastName: "Example",
                phone: "+421900123456"
            }, "PATCH"));
            
            expect(response.status).toBe(200);
            const data = await response.json();
            
            expect(data.id).toBe(user.id);
            expect(data.firstName).toBe("Alice");
            expect(data.lastName).toBe("Example");
            expect(data.phone).toBe("+421900123456");
        });
    });

    describe("PATCH /users/me/profile", () => {
        it("returns 400 for invalid body payload", async () => {
            const { cookie } = await createSignedInUser();

            // Invalid field type (number instead of string)
            const response = await authenticatedRequest("/users/me/profile", cookie, jsonRequest({
                bio: 12345
            }, "PATCH"));
            
            expect(response.status).toBe(400);
        });

        it("successfully updates allowed profile fields", async () => {
            const { user, cookie } = await createSignedInUser();

            const response = await authenticatedRequest("/users/me/profile", cookie, jsonRequest({
                bio: "This is my new bio",
                displayName: "alice_example"
            }, "PATCH"));
            
            expect(response.status).toBe(200);
            const data = await response.json();
            
            expect(data.id).toBe(user.id);
            expect(data.bio).toBe("This is my new bio");
            expect(data.displayName).toBe("alice_example");
        });
    });
});
