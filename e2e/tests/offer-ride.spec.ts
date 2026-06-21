import { test, expect, type Page } from "@playwright/test";

const DRIVER_EMAIL = "driver.albert@example.com";
const DRIVER_PASSWORD = "driver1234";

async function login(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.locator('input[name="waymate-login-email"]').fill(email);
    await page.locator('input[name="waymate-login-password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
}

async function pickCity(
    page: Page,
    fieldTestId: string,
    query: string,
    city: string
) {
    await page.getByTestId(fieldTestId).locator("input").fill(query);
    await page.getByRole("option", { name: city }).first().click();
}

async function fillRideDetails(page: Page, day: string = "15") {
    await pickCity(page, "offer-pickup", "Bratislava", "Bratislava");
    await pickCity(page, "offer-dropoff", "Nitra", "Nitra");

    await page.getByTestId("offer-date").getByRole("button").click();
    await page
        .getByRole("button", { name: /next|ďalší|další|přístí|nasledujúci/i })
        .first()
        .click();
    await page
        .getByRole("gridcell")
        .filter({ hasText: new RegExp(`^${day}$`) })
        .first()
        .click();

    await page.getByTestId("offer-time").getByRole("combobox").click();
    await page.getByRole("option", { name: "09:00" }).click();

    await page.getByTestId("offer-seats").locator("input").fill("2");
    await page.getByTestId("offer-price").locator("input").fill("10");
}

test.describe("offer a ride", () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
        await login(page, DRIVER_EMAIL, DRIVER_PASSWORD);
        await expect(page).toHaveURL(/\/passenger$/);
        await page.goto("/driver/offer");
        await expect(page.locator("h1").first()).toBeVisible();
    });

    test("driver publishes a ride with a saved car", async ({ page }) => {
        await fillRideDetails(page, "15");

        await page.getByRole("button", { name: "My cars" }).click();

        await page
            .getByTestId("publish-ride-wrapper")
            .locator("button")
            .click();
        await expect(page).toHaveURL(/\/driver\/rides$/);
    });

    test("driver publishes a ride entering a car manually", async ({
        page,
    }) => {
        await fillRideDetails(page, "16");

        await page.getByRole("button", { name: "Enter manually" }).click();

        await page.getByRole("combobox").filter({ hasText: /brand/i }).click();
        await page.getByRole("option", { name: "Škoda" }).first().click();

        await page.getByRole("combobox").filter({ hasText: /model/i }).click();
        await page.getByRole("option", { name: "Octavia" }).first().click();

        await page.getByPlaceholder("e.g., ABC 1234").fill("BA999XX");

        await page
            .getByTestId("publish-ride-wrapper")
            .locator("button")
            .click();
        await expect(page).toHaveURL(/\/driver\/rides$/);
    });

    test("publishing an empty form shows validation errors and stays put", async ({
        page,
    }) => {
        await page
            .getByTestId("publish-ride-wrapper")
            .locator("button")
            .click();

        await expect(page).toHaveURL(/\/driver\/offer$/);
        await expect(
            page.getByText("This field is required.").first()
        ).toBeVisible();
    });
});
