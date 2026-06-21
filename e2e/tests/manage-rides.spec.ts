import { test, expect, type Page } from "@playwright/test";

const DRIVER_EMAIL = "driver.albert@example.com";
const DRIVER_PASSWORD = "driver1234";

async function login(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.locator('input[name="waymate-login-email"]').fill(email);
    await page.locator('input[name="waymate-login-password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
}

async function pickCity(page: Page, fieldTestId: string, query: string, city: string) {
    await page.getByTestId(fieldTestId).locator("input").fill(query);
    await page.getByRole("option", { name: city }).first().click();
}

async function publishRide(page: Page) {
    await page.goto("/driver/offer");
    await expect(page.locator("h1").first()).toBeVisible();

    await pickCity(page, "offer-pickup", "Bratislava", "Bratislava");
    await pickCity(page, "offer-dropoff", "Nitra", "Nitra");

    await page.getByTestId("offer-date").getByRole("button").click();
    await page.getByRole("button", { name: /next|ďalší|další|přístí|nasledujúci/i }).first().click();
    await page.getByRole("gridcell").filter({ hasText: /^16$/ }).first().click();

    await page.getByTestId("offer-time").getByRole("combobox").click();
    await page.getByRole("option", { name: "14:00" }).click();

    await page.getByTestId("offer-seats").locator("input").fill("2");
    await page.getByTestId("offer-price").locator("input").fill("10");

    await page.getByRole("button", { name: "My cars" }).click();
    
    await page.getByTestId("publish-ride-wrapper").locator("button").click();
    await expect(page).toHaveURL(/\/driver\/rides$/);
}

test.describe("manage rides", () => {
    test.beforeEach(async ({ context }) => {
        await context.clearCookies();
    });

    test("driver can publish and then cancel a ride", async ({ page }) => {
        await login(page, DRIVER_EMAIL, DRIVER_PASSWORD);
        await expect(page).toHaveURL(/\/passenger$/);
        await publishRide(page);

        const cancelBtn = page.getByRole("button", { name: /cancel|zrušiť/i }).first();
        await cancelBtn.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        await dialog.getByRole("textbox").fill("Zmena plánov - musím do práce");
        await dialog.getByRole("button", { name: /confirm|potvrdiť/i }).click();
        await expect(dialog).not.toBeVisible();
    });

    test("passenger can book and then cancel a ride", async ({ page }) => {
        await login(page, "passenger.cyril@example.com", "passenger1234");
        await expect(page).toHaveURL(/\/passenger$/);

        const firstRide = page.locator(".available-ride-card").first();
        await expect(firstRide).toBeVisible();
        await firstRide.getByRole("button", { name: "Book" }).click();

        await expect(page).toHaveURL(/\/passenger\/rides$/);

        const cancelBtn = page.getByRole("button", { name: /cancel|zrušiť/i }).first();
        await cancelBtn.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        await dialog.getByRole("textbox").fill("Zmena plánov");
        await dialog.getByRole("button", { name: /confirm|potvrdiť/i }).click();
        await expect(dialog).not.toBeVisible();
    });
});
