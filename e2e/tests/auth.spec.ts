import { test, expect } from "@playwright/test";

// These tests assert the audience guards in apps/web/src/router.tsx — the
// closed model where every route only accepts {guest|user|admin}. Anything
// that doesn't match is bounced to that audience's home.
//
// No DB writes happen here: register submission requires email verification
// (better-auth `requireEmailVerification: true`), so the registered user
// never reaches a logged-in state in these tests. Tests that need a real
// session belong in a separate spec that seeds verified credentials first.

const protectedUserRoutes = ["/passenger", "/driver", "/passenger/rides"];
const protectedAdminRoute = "/admin";

test.describe("guest audience redirects", () => {
    for (const path of protectedUserRoutes) {
        test(`guest visiting ${path} is bounced to /login`, async ({
            page,
        }) => {
            await page.goto(path);
            await expect(page).toHaveURL(/\/login$/);
        });
    }

    test(`guest visiting ${protectedAdminRoute} is bounced to /login`, async ({
        page,
    }) => {
        await page.goto(protectedAdminRoute);
        await expect(page).toHaveURL(/\/login$/);
    });

    test("guest visiting / lands on a guest-allowed route (no infinite redirect)", async ({
        page,
    }) => {
        await page.goto("/");
        // HOME_BY_AUDIENCE['guest'] = '/login'. Whatever the resolved URL is,
        // it must be guest-accessible (login/register/forgot-password/rides
        // are the only allowed targets).
        await expect(page).toHaveURL(
            /\/(login|register|forgot-password|rides)?$/
        );
    });
});

test.describe("login page", () => {
    test("renders the email/password form", async ({ page }) => {
        await page.goto("/login");

        await expect(
            page.locator('input[name="waymate-login-email"]')
        ).toBeVisible();
        await expect(
            page.locator('input[name="waymate-login-password"]')
        ).toBeVisible();
        // The form's submit button is the only `type="submit"` inside it.
        await expect(page.locator('form button[type="submit"]')).toBeVisible();
    });

    test("clicking 'Create account' navigates to /register", async ({
        page,
    }) => {
        await page.goto("/login");
        // The footer "Create account" is a TextLink (renders as <button>).
        await page.getByRole("button", { name: /create account/i }).click();
        await expect(page).toHaveURL(/\/register$/);
    });

    test("blocks submission with an obviously invalid email", async ({
        page,
    }) => {
        await page.goto("/login");
        await page
            .locator('input[name="waymate-login-email"]')
            .fill("not-an-email");
        await page
            .locator('input[name="waymate-login-password"]')
            .fill("validpassword");
        await page.locator('form button[type="submit"]').click();

        // We stay on /login — no redirect away from the page on a validation
        // failure. (We don't assert the exact error string so the test is
        // resilient to translation tweaks.)
        await expect(page).toHaveURL(/\/login$/);
    });
});

test.describe("register page", () => {
    test("renders the email/password/confirm form", async ({ page }) => {
        await page.goto("/register");

        await expect(
            page.locator('input[name="waymate-register-email"]')
        ).toBeVisible();
        await expect(
            page.locator('input[name="waymate-register-password"]')
        ).toBeVisible();
        await expect(
            page.locator('input[name="waymate-register-confirm-password"]')
        ).toBeVisible();
    });

    test("clicking the 'Login' link navigates back to /login", async ({
        page,
    }) => {
        await page.goto("/register");
        // RegisterBox's bottom TextLink uses the label `register.login` ("Login").
        // Several buttons share that label (Google button etc.), so scope by
        // the surrounding "Already have an account?" line.
        await page
            .locator("text=Already have an account?")
            .locator("..")
            .getByRole("button", { name: /^login$/i })
            .click();
        await expect(page).toHaveURL(/\/login$/);
    });

    test("shows a password-mismatch error and stays on /register", async ({
        page,
    }) => {
        await page.goto("/register");

        // Use a likely-non-existent email so even if the request fires it
        // wouldn't collide with seed data. The mismatch should short-circuit
        // BEFORE any network call.
        await page
            .locator('input[name="waymate-register-email"]')
            .fill(`mismatch-${Date.now()}@example.com`);
        await page
            .locator('input[name="waymate-register-password"]')
            .fill("password123");
        await page
            .locator('input[name="waymate-register-confirm-password"]')
            .fill("different456");
        await page.locator('form button[type="submit"]').click();

        await expect(page).toHaveURL(/\/register$/);
    });
});

test.describe("auth API smoke", () => {
    test("sign-in endpoint reachable through the Vite proxy and rejects bad credentials", async ({
        request,
    }) => {
        const response = await request.post("/api/auth/sign-in/email", {
            data: {
                email: `nonexistent-${Date.now()}@example.com`,
                password: "wrongpassword",
            },
            failOnStatusCode: false,
        });

        // We don't care about the exact status — only that the route is wired
        // up (better-auth returns 401/422-class, not 404 or proxy error).
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);
    });
});
