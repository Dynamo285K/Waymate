import type { Page } from "@playwright/test";

/**
 * Intercept Mapbox Geocoding API calls and return deterministic fake results.
 *
 * This avoids burning real API quota in E2E runs, eliminates network
 * flakiness, and makes the autocomplete dropdown appear instantly.
 *
 * Must be called **before** the page navigates to a route that renders
 * a LocationAutocomplete / SearchBox (i.e. before `page.goto`).
 */
export async function mockMapboxGeocoding(page: Page) {
    await page.route("**/api.mapbox.com/geocoding/v5/**", async (route) => {
        const url = new URL(route.request().url());
        // The query is the last path segment minus ".json"
        const raw = url.pathname.split("/").pop() ?? "";
        const query = decodeURIComponent(raw.replace(/\.json$/, ""));

        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                type: "FeatureCollection",
                query: [query.toLowerCase()],
                features: [
                    {
                        id: `place.${query.toLowerCase().replace(/\s+/g, "_")}`,
                        type: "Feature",
                        place_type: ["place"],
                        relevance: 1,
                        text: query,
                        place_name: `${query}, Slovakia`,
                        center: [17.108387, 48.1438],
                        bbox: [16.946, 48.006, 17.284, 48.265],
                        context: [
                            {
                                id: "region.25805",
                                text: query,
                            },
                            {
                                id: "country.8909",
                                short_code: "sk",
                                text: "Slovakia",
                            },
                        ],
                    },
                ],
                attribution: "mock",
            }),
        });
    });
}
