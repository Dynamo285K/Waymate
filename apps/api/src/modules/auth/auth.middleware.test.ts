import { describe, it, expect } from "vitest";
import { apiRequest } from "../../../test/http";
import {
    authenticatedRequest,
    createSignInUser,
    signIn,
} from "../../../test/auth-helpers";

// Every protected route group is gated by one of the Elysia auth macros
// (isAuthenticated / isFullyOnboarded / requireAdmin). The service-layer tests
// all assume the caller is already authorised, so this file is the only place
// that exercises the guards at the HTTP boundary.

describe("Route protection — unauthenticated access is rejected", () => {
    const protectedEndpoints = [
        { module: "users", method: "GET", path: "/users/me" },
        { module: "cars", method: "GET", path: "/cars/me" },
        { module: "rides", method: "GET", path: "/rides/me" },
        { module: "bookings", method: "GET", path: "/bookings/me" },
        { module: "reviews", method: "GET", path: "/reviews/me/authored" },
        { module: "admin", method: "GET", path: "/admin/dashboard" },
    ] as const;

    for (const { module, method, path } of protectedEndpoints) {
        it(`returns 401 for ${method} ${path} (${module}) without a session`, async () => {
            const response = await apiRequest(path, { method });

            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({
                error: "UNAUTHORIZED",
            });
        });
    }
});

describe("Route protection — requireAdmin", () => {
    it("rejects a non-admin session from an admin route with 403 FORBIDDEN", async () => {
        const { email, password } = await createSignInUser({ role: "USER" });
        const cookie = await signIn(email, password);

        const response = await authenticatedRequest("/admin/dashboard", cookie);

        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toEqual({ error: "FORBIDDEN" });
    });

    it("lets an admin session through to an admin route", async () => {
        const { email, password } = await createSignInUser({ role: "ADMIN" });
        const cookie = await signIn(email, password);

        const response = await authenticatedRequest("/admin/dashboard", cookie);

        expect(response.status).toBe(200);
    });
});

describe("Route protection — isFullyOnboarded", () => {
    it("rejects a logged-in but not-yet-onboarded user with 403 ONBOARDING_REQUIRED", async () => {
        const { email, password } = await createSignInUser({
            onboarded: false,
        });
        const cookie = await signIn(email, password);

        const response = await authenticatedRequest("/cars/me", cookie);

        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toEqual({
            error: "ONBOARDING_REQUIRED",
        });
    });

    it("lets a fully onboarded user through an onboarding-gated route", async () => {
        const { email, password } = await createSignInUser({
            onboarded: true,
        });
        const cookie = await signIn(email, password);

        const response = await authenticatedRequest("/cars/me", cookie);

        expect(response.status).toBe(200);
    });
});
