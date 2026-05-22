import { test, expect, type Page } from "@playwright/test";

// Seeded by apps/api/src/db/seed.ts and refreshed in global-setup.ts before
// each run. Cyril is a regular user with a completed profile, so post-login
// navigation skips /onboarding.
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
        // Start each test with a clean cookie jar so sessions don't bleed.
        await context.clearCookies();
    });

    test("passenger books an available ride from the home page", async ({
        page,
    }) => {
        await login(page, PASSENGER_EMAIL, PASSENGER_PASSWORD);

        // Completed profile → getPostAuthPath routes Cyril to the passenger
        // home, which lists upcoming available rides (seeded).
        await expect(page).toHaveURL(/\/passenger$/);

        const firstRide = page.locator(".available-ride-card").first();
        await expect(firstRide).toBeVisible();

        // Booking creates a PENDING booking and, on success, routes to the
        // passenger's "my rides" — reaching that URL proves the booking
        // round-trip (API + DB) succeeded.
        await firstRide.getByRole("button", { name: "Book" }).click();

        await expect(page).toHaveURL(/\/passenger\/rides$/);
    });
});
