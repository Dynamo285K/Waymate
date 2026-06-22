import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin1234";

async function login(page: Page, email: string, password: string) {
    await page.goto("/login");
    await page.locator('input[name="waymate-login-email"]').fill(email);
    await page.locator('input[name="waymate-login-password"]').fill(password);
    await page.locator('form button[type="submit"]').click();
}

test.describe("admin flow", () => {
    test.beforeEach(async ({ context }) => {
        await context.clearCookies();
    });

    test("admin can view dashboard statistics and metrics", async ({
        page,
    }) => {
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

        // Správca by mal byť automaticky presmerovaný na /admin po prihlásení
        await expect(page).toHaveURL(/\/admin$/);

        // Overíme prítomnosť sekcie "User Metrics" pomocou textových štítkov
        await expect(page.getByRole("heading", { name: "User Metrics" })).toBeVisible();
        await expect(page.getByText("Total Registered")).toBeVisible();
        await expect(page.getByText("Drivers")).toBeVisible();
        await expect(page.getByText("Banned")).toBeVisible();

        // Tlačidlo na export reportu
        const exportBtn = page.getByRole("button", { name: /Export/i });
        await expect(exportBtn).toBeVisible();

        // Grafy používajú knižnicu Recharts, ktorá renderuje <svg> s triedou recharts-surface.
        // Overíme, že sa vyrenderoval aspoň jeden takýto graf (napr. Weekly Rides alebo Weekly Revenue).
        const charts = page.locator("svg.recharts-surface");
        await expect(charts.first()).toBeVisible();
    });
});
