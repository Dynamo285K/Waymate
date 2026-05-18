import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
    test("landing page loads", async ({ page }) => {
        const response = await page.goto("/");
        expect(response?.ok()).toBe(true);

        // The Vite-mounted app injects content into #root; assert the React
        // tree mounted by waiting for any descendant element.
        await expect(page.locator("#root *").first()).toBeVisible();
    });

    test("api health endpoint responds via proxy", async ({ request }) => {
        // Vite dev server proxies /api/* to the API. Hitting through the web
        // origin (instead of localhost:3000 directly) also exercises the
        // proxy config, which is what real browser traffic uses.
        const response = await request.get("/api/health");
        expect(response.ok()).toBe(true);
        const body = await response.json();
        expect(body).toHaveProperty("status");
    });
});
