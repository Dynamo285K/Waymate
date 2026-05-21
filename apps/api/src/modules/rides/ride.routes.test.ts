import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { TEST_CITY_IDS } from "../../../test/reference-data";
import { apiRequest } from "../../../test/http";
import { db } from "../../db";
import { carModels, cars, rides, users } from "../../db/schema";
import { RideService } from "./ride.service";
import {
    authenticatedRequest,
    createSignInUser,
    signIn,
} from "../../../test/auth-helpers";
import type { CreateRideBody } from "@repo/shared";

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

// Route-level coverage for the ride-completion endpoints. The service logic
// (RideService.endRide / completeRide) is covered in ride.service.test.ts;
// these tests exercise the HTTP boundary — the isFullyOnboarded guard, :id
// validation, and domain-error → HTTP-status mapping.
describe("RideRoutes ride completion (PATCH /:id/complete, /:id/end)", () => {
    const HOUR = 60 * 60 * 1000;
    const JSON_HEADERS = { "content-type": "application/json" };

    async function insertUser() {
        const [user] = await db
            .insert(users)
            .values({
                name: "Ride Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
            })
            .returning();
        if (!user) throw new Error("Failed to insert test user");
        return user;
    }

    async function insertCarFor(ownerId: string) {
        const [model] = await db.select().from(carModels).limit(1);
        if (!model) throw new Error("car_models is empty — reseed reference data");
        const [car] = await db
            .insert(cars)
            .values({
                ownerId,
                modelId: model.id,
                spz: `R${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
                countryCode: "SK",
                color: "BLUE",
                seatsTotal: 4,
                isActive: true,
            })
            .returning();
        if (!car) throw new Error("Failed to insert test car");
        return car;
    }

    function buildRideBody(carId: string, departureAt: Date): CreateRideBody {
        return {
            carId,
            departureAt,
            arrivalEstimateAt: new Date(departureAt.getTime() + HOUR),
            offeredSeats: 3,
            currency: "EUR",
            description: null,
            stops: [
                {
                    cityId: TEST_CITY_IDS.bratislava,
                    address: "Hlavná 1",
                    lat: 48.148,
                    lng: 17.107,
                    plannedArrivalAt: null,
                    plannedDepartureAt: departureAt,
                },
                {
                    cityId: TEST_CITY_IDS.banskaBystrica,
                    address: "Námestie SNP 1",
                    lat: 48.736,
                    lng: 19.146,
                    plannedArrivalAt: new Date(departureAt.getTime() + 2 * HOUR),
                    plannedDepartureAt: null,
                },
            ],
            prices: undefined,
        };
    }

    // Creates a ride straight through the service (the future-departure rule
    // is a route-level Zod refine, so the service accepts a past departure).
    async function createRide(driverId: string, departureAt: Date) {
        const car = await insertCarFor(driverId);
        return RideService.createRide(driverId, buildRideBody(car.id, departureAt));
    }

    it("returns 401 for PATCH /:id/complete without a session", async () => {
        const response = await apiRequest(
            `/rides/${crypto.randomUUID()}/complete`,
            { method: "PATCH", headers: JSON_HEADERS, body: "{}" }
        );

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({
            error: "UNAUTHORIZED",
        });
    });

    it("returns 401 for PATCH /:id/end without a session", async () => {
        const response = await apiRequest(`/rides/${crypto.randomUUID()}/end`, {
            method: "PATCH",
            headers: JSON_HEADERS,
            body: "{}",
        });

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({
            error: "UNAUTHORIZED",
        });
    });

    it("returns 400 VALIDATION for PATCH /:id/complete with a non-UUID id", async () => {
        const { email, password } = await createSignInUser({ onboarded: true });
        const cookie = await signIn(email, password);

        const response = await authenticatedRequest(
            "/rides/not-a-uuid/complete",
            cookie,
            { method: "PATCH", headers: JSON_HEADERS, body: "{}" }
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({ error: "VALIDATION" });
    });

    it("completes a departed ride via PATCH /:id/complete and returns 200", async () => {
        const driver = await createSignInUser({ onboarded: true });
        const rideId = await createRide(
            driver.user.id,
            new Date(Date.now() - 2 * HOUR)
        );
        const cookie = await signIn(driver.email, driver.password);

        const response = await authenticatedRequest(
            `/rides/${rideId}/complete`,
            cookie,
            { method: "PATCH", headers: JSON_HEADERS, body: "{}" }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            id: rideId,
            status: "COMPLETED",
        });

        const ride = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        expect(ride!.rideStatus).toBe("COMPLETED");
    });

    it("ends a departed ride via PATCH /:id/end and returns 200", async () => {
        const driver = await createSignInUser({ onboarded: true });
        const rideId = await createRide(
            driver.user.id,
            new Date(Date.now() - 2 * HOUR)
        );
        const cookie = await signIn(driver.email, driver.password);

        const response = await authenticatedRequest(
            `/rides/${rideId}/end`,
            cookie,
            { method: "PATCH", headers: JSON_HEADERS, body: "{}" }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            id: rideId,
            status: "COMPLETED",
        });
    });

    // Domain errors from these isFullyOnboarded-guarded routes are caught by
    // the root .onError, not the module's — Elysia hoists named-plugin scopes
    // (see the comment in apps/api/src/index.ts). They therefore surface as
    // 409 with the error code, not the module's 400/404 mapping.
    it("returns 409 RIDE_NOT_DEPARTED for a ride whose departure is still in the future", async () => {
        const driver = await createSignInUser({ onboarded: true });
        const rideId = await createRide(
            driver.user.id,
            new Date(Date.now() + 24 * HOUR)
        );
        const cookie = await signIn(driver.email, driver.password);

        const response = await authenticatedRequest(
            `/rides/${rideId}/complete`,
            cookie,
            { method: "PATCH", headers: JSON_HEADERS, body: "{}" }
        );

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({
            error: "RIDE_NOT_DEPARTED",
        });
    });

    it("returns 409 RIDE_NOT_FOUND_OR_NOT_OWNER when a non-owner completes the ride", async () => {
        const owner = await insertUser();
        const rideId = await createRide(
            owner.id,
            new Date(Date.now() - 2 * HOUR)
        );
        const stranger = await createSignInUser({ onboarded: true });
        const cookie = await signIn(stranger.email, stranger.password);

        const response = await authenticatedRequest(
            `/rides/${rideId}/complete`,
            cookie,
            { method: "PATCH", headers: JSON_HEADERS, body: "{}" }
        );

        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toEqual({
            error: "RIDE_NOT_FOUND_OR_NOT_OWNER",
        });
    });
});
