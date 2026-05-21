import { describe, expect, it } from "vitest";
import { TEST_CITY_IDS } from "../../../test/reference-data";
import { apiRequest } from "../../../test/http";

describe("RideRoutes public endpoints", () => {
    it("returns an empty list from GET /rides/available when no rides exist", async () => {
        const response = await apiRequest("/rides/available");

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual([]);
    });

    it("returns an empty list from GET /rides/search for a valid no-match query", async () => {
        const travelDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
        const response = await apiRequest(
            `/rides/search?startCityId=${TEST_CITY_IDS.bratislava}&destinationCityId=${TEST_CITY_IDS.banskaBystrica}&travelDate=${travelDate}`
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual([]);
    });

    it("returns VALIDATION for GET /rides/search with invalid city ids", async () => {
        const response = await apiRequest(
            "/rides/search?startCityId=not-a-uuid&destinationCityId=also-not-a-uuid&travelDate=2026-01-01"
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "VALIDATION",
        });
    });
});
