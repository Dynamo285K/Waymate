import { test, expect, type Page } from "@playwright/test";

const PASSENGER_EMAIL = "passenger.cyril@example.com";
const PASSENGER_PASSWORD = "passenger1234";

async function login(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.locator('input[name="waymate-login-email"]').fill(email);
    await page.locator('input[name="waymate-login-password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
}

test.describe("book a ride", () => {
    test.beforeEach(async ({ context }) => {
        await context.clearCookies();
    });

    test("passenger books an available ride from the home page", async ({
        page,
    }) => {
        await login(page, PASSENGER_EMAIL, PASSENGER_PASSWORD);

        await expect(page).toHaveURL(/\/passenger$/);

        const firstRide = page.locator(".available-ride-card").first();
        await expect(firstRide).toBeVisible();

        await firstRide.getByRole("button", { name: "Book" }).click();

        await expect(page).toHaveURL(/\/passenger\/rides$/);
    });
});
