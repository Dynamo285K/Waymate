import { test, expect, type Page } from "@playwright/test";

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

        await expect(page).toHaveURL(/\/passenger$/);
    });

    test("wrong password keeps the user on /login", async ({ page }) => {
        await page.goto("/login");
        await fillLoginForm(page, ADMIN_EMAIL, "definitely-not-the-password");

        await expect(page).toHaveURL(/\/login$/);
    });

    test("logged-in admin is bounced from guest- and user-only routes back to /admin", async ({
        page,
    }) => {
        await page.goto("/login");
        await fillLoginForm(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await expect(page).toHaveURL(/\/admin$/);

        await page.goto("/login");
        await expect(page).toHaveURL(/\/admin$/);

        await page.goto("/passenger");
        await expect(page).toHaveURL(/\/admin$/);
    });
});
