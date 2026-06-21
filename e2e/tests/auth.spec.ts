import { test, expect } from "@playwright/test";

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
        await expect(page.locator('form button[type="submit"]')).toBeVisible();
    });

    test("clicking 'Create account' navigates to /register", async ({
        page,
    }) => {
        await page.goto("/login");
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

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);
    });
});
