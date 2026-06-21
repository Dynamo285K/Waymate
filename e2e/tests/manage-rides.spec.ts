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

async function publishRide(
    page: Page,
    fromCity = "Bratislava",
    toCity = "Nitra",
    day = "16",
    price = "10"
) {
    await page.goto("/driver/offer");
    await expect(page.locator("h1").first()).toBeVisible();

    await pickCity(page, "offer-pickup", fromCity, fromCity);
    await pickCity(page, "offer-dropoff", toCity, toCity);

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
    await page.getByRole("option", { name: "14:00" }).click();

    await page.getByTestId("offer-seats").locator("input").fill("2");
    await page.getByTestId("offer-price").locator("input").fill(price);

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
        await publishRide(page, "Bratislava", "Nitra", "16");

        const rideCard = page
            .getByTestId("ride-card")
            .filter({ hasText: "Nitra" })
            .first();
        const cancelBtn = rideCard.getByRole("button", {
            name: /cancel|zrušiť/i,
        });
        await cancelBtn.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        const cancelPromise = page.waitForResponse(
            (r) =>
                r.url().includes("/cancel") && r.request().method() === "PATCH"
        );
        await dialog.getByRole("textbox").fill("Zmena plánov - musím do práce");
        await dialog.getByRole("button", { name: /confirm|potvrdiť/i }).click();

        const cancelResponse = await cancelPromise;
        expect(cancelResponse.status()).toBe(200);
        await expect(dialog).not.toBeVisible();
    });

    test("passenger can book and then cancel a ride", async ({ page }) => {
        // Driver creates a fresh, unique ride so there's no collision with seed data
        await login(page, DRIVER_EMAIL, DRIVER_PASSWORD);
        await expect(page).toHaveURL(/\/passenger$/);
        await publishRide(page, "Bratislava", "Trnava", "18", "12");

        // Switch to passenger
        await page.context().clearCookies();
        await login(page, "passenger.cyril@example.com", "passenger1234");
        await expect(page).toHaveURL(/\/passenger$/);

        // Book the specific ride we just created
        const specificRide = page
            .locator(".available-ride-card", { hasText: "Trnava" })
            .first();
        await expect(specificRide).toBeVisible();
        await specificRide.getByRole("button", { name: "Book" }).click();

        await expect(page).toHaveURL(/\/passenger\/rides$/);

        // Cancel the booking
        const bookedRideCard = page
            .getByTestId("ride-card")
            .filter({ hasText: "Trnava" })
            .first();
        const cancelBtn = bookedRideCard.getByRole("button", {
            name: /cancel|zrušiť/i,
        });
        await cancelBtn.click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        const cancelPromise = page.waitForResponse(
            (r) =>
                r.url().includes("/cancel") && r.request().method() === "PATCH"
        );
        await dialog.getByRole("textbox").fill("Zmena plánov");
        await dialog.getByRole("button", { name: /confirm|potvrdiť/i }).click();

        const cancelResponse = await cancelPromise;
        expect(cancelResponse.status()).toBe(200);
        await expect(dialog).not.toBeVisible();
    });
});
