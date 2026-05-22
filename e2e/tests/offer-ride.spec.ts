import { test, expect, type Page } from "@playwright/test";

// Seeded by apps/api/src/db/seed.ts. Albert is a regular user with a
// completed profile and saved cars, so he can publish a ride end to end.
const DRIVER_EMAIL = "driver.albert@example.com";
const DRIVER_PASSWORD = "driver1234";

async function login(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.locator('input[name="waymate-login-email"]').fill(email);
    await page.locator('input[name="waymate-login-password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
}

// Types into a CitySelect autocomplete and picks the matching suggestion.
async function pickCity(
    page: Page,
    fieldTestId: string,
    query: string,
    city: string
) {
    await page.getByTestId(fieldTestId).locator("input").fill(query);
    await page.getByRole("option", { name: city }).first().click();
}

test.describe("offer a ride", () => {
    test.beforeEach(async ({ context }) => {
        await context.clearCookies();
    });

    test("driver publishes a ride with a saved car", async ({ page }) => {
        await login(page, DRIVER_EMAIL, DRIVER_PASSWORD);
        // The driver-seeded account has a completed profile → lands on the
        // passenger home; wait for it so the session is fully established.
        await expect(page).toHaveURL(/\/passenger$/);

        await page.goto("/driver/offer");
        await expect(
            page.getByRole("heading", { name: "Offer a ride" })
        ).toBeVisible();

        // Route
        await pickCity(page, "offer-pickup", "Bratislava", "Bratislava");
        await pickCity(page, "offer-dropoff", "Nitra", "Nitra");

        // Date — open the picker, jump to next month, pick the 15th: always
        // in the future, always exists, never disabled by disablePastDates.
        await page.locator(".datepicker__input").click();
        await page.locator(".datepicker__popup nav button").last().click();
        await page
            .locator(".datepicker__popup")
            .getByRole("button", { name: "15" })
            .first()
            .click();

        // Time
        await page.locator(".offer-ride-form__time-trigger").click();
        await page.getByRole("option", { name: "09:00" }).click();

        // Duration — 1 h 30 min
        const duration = page.getByTestId("offer-duration").locator("input");
        await duration.first().fill("1");
        await duration.nth(1).fill("30");

        // Seats & price
        await page.getByTestId("offer-seats").locator("input").fill("2");
        await page.getByTestId("offer-price").locator("input").fill("10");

        // Use a saved car (the segmented control appears once cars load)
        await page.getByRole("button", { name: "My cars" }).click();

        // Publishing routes the driver to their rides list on success.
        await page.getByRole("button", { name: "Publish ride" }).click();

        await expect(page).toHaveURL(/\/driver\/rides$/);
    });
});
