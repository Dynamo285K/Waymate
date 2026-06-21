import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { apiRequest, jsonRequest } from "../../../test/http";
import {
    authenticatedRequest,
    createSignedInUser,
} from "../../../test/auth-helpers";
import { getAnyCarModelId } from "../../../test/reference-data";
import { db } from "../../db";
import { carModels, cars, rides } from "../../db/schema";
import { CarErrorCodes } from "./car.errors";

describe("CarRoutes", () => {
    describe("Authorization & Onboarding Guards", () => {
        it("returns 401 UNAUTHORIZED for GET /cars/me without a session", async () => {
            const response = await apiRequest("/cars/me");
            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({ error: "UNAUTHORIZED" });
        });

        it("returns 403 ONBOARDING_REQUIRED for GET /cars/me with a non-onboarded user", async () => {
            const { cookie } = await createSignedInUser({ onboarded: false });
            const response = await authenticatedRequest("/cars/me", cookie);
            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toEqual({ error: "ONBOARDING_REQUIRED" });
        });
    });

    describe("Read-Only Dictionary Routes", () => {
        it("returns country codes via GET /cars/country-codes", async () => {
            const { cookie } = await createSignedInUser();
            const response = await authenticatedRequest("/cars/country-codes", cookie);
            
            expect(response.status).toBe(200);
            const data = await response.json() as string[];
            expect(data.length).toBeGreaterThan(0);
            expect(data).toContain("SK");
        });

        it("returns car brands via GET /cars/brands", async () => {
            const { cookie } = await createSignedInUser();
            const response = await authenticatedRequest("/cars/brands", cookie);
            
            expect(response.status).toBe(200);
            const data = await response.json() as { brand: string }[];
            expect(data.length).toBeGreaterThan(0);
            expect(data.map(d => d.brand)).toContain("Škoda");
        });

        it("returns car models for a brand via GET /cars/brands/:brand/models", async () => {
            const { cookie } = await createSignedInUser();
            const response = await authenticatedRequest("/cars/brands/Škoda/models", cookie);
            
            expect(response.status).toBe(200);
            const data = await response.json() as { id: number; brand: string; modelName: string }[];
            expect(data.length).toBeGreaterThan(0);
            expect(data[0]!.brand).toBe("Škoda");
        });
    });

    describe("Car Management", () => {
        it("creates a new car via POST /cars/me", async () => {
            const { user, cookie } = await createSignedInUser();
            const modelId = await getAnyCarModelId();
            
            const spz = `BA${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

            const response = await authenticatedRequest("/cars/me", cookie, jsonRequest({
                modelId,
                spz,
                countryCode: "SK",
                color: "RED",
                seatsTotal: 5,
            }));

            expect(response.status).toBe(201);
            const data = await response.json() as { id: string, spz: string, ownerId: string };
            expect(data.id).toBeTruthy();
            expect(data.spz).toBe(spz);

            // Verify in DB
            const car = await db.query.cars.findFirst({
                where: eq(cars.id, data.id)
            });
            expect(car!.ownerId).toBe(user.id);
        });

        it("returns 400 ModelNotFound when providing invalid model ID", async () => {
            const { cookie } = await createSignedInUser();
            
            const response = await authenticatedRequest("/cars/me", cookie, jsonRequest({
                modelId: 99999999, // Non-existent model ID
                spz: `XX${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
                countryCode: "SK",
                color: "BLUE",
                seatsTotal: 5,
            }));

            expect(response.status).toBe(400);
            await expect(response.json()).resolves.toMatchObject({
                error: CarErrorCodes.ModelNotFound
            });
        });

        it("returns 409 DuplicatePlate when creating car with an already registered SPZ", async () => {
            const { cookie } = await createSignedInUser();
            const modelId = await getAnyCarModelId();
            const spz = `TT${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

            // Create first car
            await authenticatedRequest("/cars/me", cookie, jsonRequest({
                modelId, spz, countryCode: "SK", color: "BLACK", seatsTotal: 4
            }));

            // Try to create another car with the same SPZ
            const response2 = await authenticatedRequest("/cars/me", cookie, jsonRequest({
                modelId, spz, countryCode: "SK", color: "WHITE", seatsTotal: 4
            }));

            expect(response2.status).toBe(409);
            await expect(response2.json()).resolves.toMatchObject({
                error: CarErrorCodes.DuplicatePlate
            });
        });

        it("lists current user's cars via GET /cars/me", async () => {
            const { cookie } = await createSignedInUser();
            const modelId = await getAnyCarModelId();
            const spz = `NR${crypto.randomUUID().slice(0, 5).toUpperCase()}`;

            await authenticatedRequest("/cars/me", cookie, jsonRequest({
                modelId, spz, countryCode: "SK", color: "GRAY", seatsTotal: 4
            }));

            const response = await authenticatedRequest("/cars/me", cookie);
            expect(response.status).toBe(200);
            
            const data = await response.json() as { id: string, spz: string }[];
            expect(data).toHaveLength(1);
            expect(data[0]!.spz).toBe(spz);
        });

        it("updates car status via PATCH /cars/:id/status", async () => {
            const { cookie } = await createSignedInUser();
            const modelId = await getAnyCarModelId();
            
            const createResponse = await authenticatedRequest("/cars/me", cookie, jsonRequest({
                modelId, spz: `KE${crypto.randomUUID().slice(0, 5).toUpperCase()}`, countryCode: "SK", color: "WHITE", seatsTotal: 4
            }));
            const car = await createResponse.json() as { id: string, isActive: boolean };
            expect(car.isActive).toBe(true);

            const patchResponse = await authenticatedRequest(`/cars/${car.id}/status`, cookie, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ isActive: false })
            });

            expect(patchResponse.status).toBe(200);
            const updatedCar = await patchResponse.json() as { isActive: boolean };
            expect(updatedCar.isActive).toBe(false);
        });

        it("returns 404 when trying to update someone else's car status", async () => {
            const { cookie: ownerCookie } = await createSignedInUser();
            const { cookie: strangerCookie } = await createSignedInUser();
            const modelId = await getAnyCarModelId();
            
            const createResponse = await authenticatedRequest("/cars/me", ownerCookie, jsonRequest({
                modelId, spz: `PO${crypto.randomUUID().slice(0, 5).toUpperCase()}`, countryCode: "SK", color: "BLACK", seatsTotal: 4
            }));
            const car = await createResponse.json() as { id: string };

            const response = await authenticatedRequest(`/cars/${car.id}/status`, strangerCookie, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ isActive: false })
            });

            if (response.status !== 404) {
                console.log("PATCH STATUS 404 TEST FAILED:", response.status, await response.text());
            }

            expect(response.status).toBe(404); // Actually CarNotFound results in 404 usually for "not found or not owner"
        });

        it("soft-deletes a car via DELETE /cars/:id", async () => {
            const { cookie } = await createSignedInUser();
            const modelId = await getAnyCarModelId();
            
            const createResponse = await authenticatedRequest("/cars/me", cookie, jsonRequest({
                modelId, spz: `ZA${crypto.randomUUID().slice(0, 5).toUpperCase()}`, countryCode: "SK", color: "RED", seatsTotal: 4
            }));
            const car = await createResponse.json() as { id: string };

            const deleteResponse = await authenticatedRequest(`/cars/${car.id}`, cookie, {
                method: "DELETE"
            });

            expect(deleteResponse.status).toBe(200);

            // Car should no longer appear in the GET /cars/me list
            const getResponse = await authenticatedRequest("/cars/me", cookie);
            const list = await getResponse.json() as any[];
            expect(list).toHaveLength(0);
        });

        it("returns 409 CarInUse when deleting a car assigned to an active ride", async () => {
            const { user, cookie } = await createSignedInUser();
            const modelId = await getAnyCarModelId();
            
            const createResponse = await authenticatedRequest("/cars/me", cookie, jsonRequest({
                modelId, spz: `BB${crypto.randomUUID().slice(0, 5).toUpperCase()}`, countryCode: "SK", color: "BLUE", seatsTotal: 4
            }));
            const car = await createResponse.json() as { id: string };

            // Create a dummy IN_PROGRESS ride attached to this car
            await db.insert(rides).values({
                driverId: user.id,
                carId: car.id,
                departureAt: new Date(),
                arrivalEstimateAt: new Date(Date.now() + 1000000),
                offeredSeats: 3,
                currency: "EUR",
                rideStatus: "IN_PROGRESS"
            });

            const deleteResponse = await authenticatedRequest(`/cars/${car.id}`, cookie, {
                method: "DELETE"
            });

            expect(deleteResponse.status).toBe(409);
            await expect(deleteResponse.json()).resolves.toMatchObject({
                error: CarErrorCodes.CarInUse
            });
        });
    });
});
