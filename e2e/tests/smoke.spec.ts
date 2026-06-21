import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
    test("landing page loads", async ({ page }) => {
        const response = await page.goto("/");
        expect(response?.ok()).toBe(true);

        await expect(page.locator("#root *").first()).toBeVisible();
    });

    test("api health endpoint responds via proxy", async ({ request }) => {
        const response = await request.get("/api/health");
        expect(response.ok()).toBe(true);
        const body = await response.json();
        expect(body).toHaveProperty("status");
    });
});
