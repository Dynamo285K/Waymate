import { test, expect, type Page } from "@playwright/test";

// Credentials seeded by apps/api/src/db/seed.ts and refreshed in global-setup.ts
// before each Playwright run. Both seed users have firstName/lastName/phone set,
// so post-auth navigation skips /onboarding.
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin1234";
const DRIVER_EMAIL = "driver.albert@example.com";
const DRIVER_PASSWORD = "driver1234";

async function fillLoginForm(page: Page, email: string, password: string) {
    await page.locator('input[name="waymate-login-email"]').fill(email);
    await page.locator('input[name="waymate-login-password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
}

test.describe("login flow", () => {
    test.beforeEach(async ({ context }) => {
        // Each test starts with a clean cookie jar so previous sessions
        // don't bleed across cases.
        await context.clearCookies();
    });

    test("admin login lands on /admin", async ({ page }) => {
        await page.goto("/login");
        await fillLoginForm(page, ADMIN_EMAIL, ADMIN_PASSWORD);

        await expect(page).toHaveURL(/\/admin$/);
    });

    test("user (driver-seeded) login lands on /passenger", async ({ page }) => {
        await page.goto("/login");
        await fillLoginForm(page, DRIVER_EMAIL, DRIVER_PASSWORD);

        // The seed sets firstName/lastName/phone, so hasCompletedOnboarding
        // is true and getPostAuthPath routes them to /passenger.
        await expect(page).toHaveURL(/\/passenger$/);
    });

    test("wrong password keeps the user on /login", async ({ page }) => {
        await page.goto("/login");
        await fillLoginForm(page, ADMIN_EMAIL, "definitely-not-the-password");

        // No redirect away from /login; we don't assert the exact error
        // string so the test survives i18n tweaks.
        await expect(page).toHaveURL(/\/login$/);
    });

    test("logged-in admin is bounced from guest- and user-only routes back to /admin", async ({
        page,
    }) => {
        // Single login covers both redirect checks. Better-auth rate-limits
        // /sign-in/email to 5 attempts per 60s, so we keep the suite well
        // under that ceiling by reusing one session for orthogonal asserts.
        await page.goto("/login");
        await fillLoginForm(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await expect(page).toHaveURL(/\/admin$/);

        // /login is audience: ["guest"] — an admin must not see it.
        await page.goto("/login");
        await expect(page).toHaveURL(/\/admin$/);

        // /passenger is audience: ["user"] — admins bounce to their own home.
        await page.goto("/passenger");
        await expect(page).toHaveURL(/\/admin$/);
    });
});
