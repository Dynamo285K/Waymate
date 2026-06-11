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

// Fills everything on the offer-ride form except the car section: route,
// date (the 15th of next month — always future, never disabled), time,
// duration, seats and price.
async function fillRideDetails(page: Page) {
    await pickCity(page, "offer-pickup", "Bratislava", "Bratislava");
    await pickCity(page, "offer-dropoff", "Nitra", "Nitra");

    await page.getByTestId("offer-date").getByRole("button").click();
    // Navigate to next month to ensure the date is in the future
    await page.getByRole("button", { name: /next|ďalší|další|přístí|nasledujúci/i }).first().click();
    await page.getByRole("gridcell").filter({ hasText: /^15$/ }).first().click();

    await page.getByTestId("offer-time").getByRole("combobox").click();
    await page.getByRole("option", { name: "09:00" }).click();

    const duration = page.getByTestId("offer-duration").locator("input");
    await duration.first().fill("1");
    await duration.nth(1).fill("30");

    await page.getByTestId("offer-seats").locator("input").fill("2");
    await page.getByTestId("offer-price").locator("input").fill("10");
}

test.describe("offer a ride", () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
        await login(page, DRIVER_EMAIL, DRIVER_PASSWORD);
        // Driver-seeded account has a completed profile → lands on the
        // passenger home; wait for it so the session is fully established.
        await expect(page).toHaveURL(/\/passenger$/);
        await page.goto("/driver/offer");
        await expect(page.locator("h1").first()).toBeVisible();
    });

    test("driver publishes a ride with a saved car", async ({ page }) => {
        await fillRideDetails(page);

        // Use a saved car (the segmented control appears once cars load).
        await page.getByRole("button", { name: "My cars" }).click();

        // Publishing routes the driver to their rides list on success.
        await page.getByTestId("publish-ride-wrapper").locator("button").click();
        await expect(page).toHaveURL(/\/driver\/rides$/);
    });

    test("driver publishes a ride entering a car manually", async ({
        page,
    }) => {
        await fillRideDetails(page);

        // Switch to manual car entry, then pick a brand + model the seed
        // guarantees exist in car_models so the model id resolves.
        await page.getByRole("button", { name: "Enter manually" }).click();

        await page.getByRole("combobox").filter({ hasText: /brand/i }).click();
        await page.getByRole("option", { name: "Škoda" }).first().click();

        await page.getByRole("combobox").filter({ hasText: /model/i }).click();
        await page.getByRole("option", { name: "Octavia" }).first().click();

        await page.getByPlaceholder("e.g., ABC 1234").fill("BA999XX");

        await page.getByTestId("publish-ride-wrapper").locator("button").click();
        await expect(page).toHaveURL(/\/driver\/rides$/);
    });

    test("publishing an empty form shows validation errors and stays put", async ({
        page,
    }) => {
        // Submit with nothing filled — the RHF resolver must block the
        // submission, keep the driver on the form, and surface field errors.
        await page.getByTestId("publish-ride-wrapper").locator("button").click();

        await expect(page).toHaveURL(/\/driver\/offer$/);
        await expect(
            page.getByText("This field is required.").first()
        ).toBeVisible();
    });
});
