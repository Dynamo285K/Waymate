import { describe, expect, it } from "vitest";
import { TEST_CITY_IDS } from "../../../test/reference-data";
import { apiRequest } from "../../../test/http";

describe("CityRoutes", () => {
    it("returns matching cities for GET /cities", async () => {
        const response = await apiRequest("/cities?q=bra&country=SK");

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual([
            expect.objectContaining({
                id: TEST_CITY_IDS.bratislava,
                name: "Bratislava",
                countryCode: "SK",
            }),
        ]);
    });

    it("returns VALIDATION for GET /cities without required q", async () => {
        const response = await apiRequest("/cities?country=SK");

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "VALIDATION",
        });
    });
});
