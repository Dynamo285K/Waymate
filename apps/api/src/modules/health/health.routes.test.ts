import { describe, expect, it } from "vitest";
import { apiRequest } from "../../../test/http";

describe("HealthRoutes", () => {
    it("responds to GET /health with API and DB status", async () => {
        const response = await apiRequest("/health");

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            status: "ok",
            db: "up",
        });
    });
});
