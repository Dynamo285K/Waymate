import { test, expect } from "@playwright/test";

test.describe("search for rides", () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearCookies();
        await page.goto("/");
        await expect(page.locator("h1").first()).toBeVisible();
    });

    test("guest can search for a route and see results page", async ({
        page,
    }) => {
        const inputs = page.getByRole("textbox");

        await inputs.nth(0).fill("Bratislava");
        await page
            .getByRole("option", { name: /Bratislava/i })
            .first()
            .click();

        await inputs.nth(1).fill("Nitra");
        await page.getByRole("option", { name: /Nitra/i }).first().click();

        await page.getByText("dd.mm.yy").click();

        await page
            .getByRole("button", {
                name: /next|ďalší|další|přístí|nasledujúci/i,
            })
            .first()
            .click();

        await page
            .getByRole("gridcell")
            .filter({ hasText: /^15$/ })
            .first()
            .click();

        await page.getByRole("button", { name: "Search" }).click();
        await expect(page).toHaveURL(
            /\/rides\?.*startCity=Bratislava.*destCity=Nitra/i
        );
        await expect(page.locator("h2").first()).toBeVisible();
    });
});
