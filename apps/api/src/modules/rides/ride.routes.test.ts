import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { TEST_CITY_IDS } from "../../../test/reference-data";
import { apiRequest } from "../../../test/http";
import {
    authenticatedRequest,
    createSignInUser,
    signIn,
} from "../../../test/auth-helpers";
import { db } from "../../db";
import { carModels, cars, rides } from "../../db/schema";
import { RideService } from "./ride.service";
import { RideErrorCodes } from "./ride.errors";
import type { CreateRideBody } from "@repo/shared";

async function getAnyCarModelId(): Promise<number> {
    const [model] = await db.select().from(carModels).limit(1);
    if (!model) {
        throw new Error(
            "car_models is empty — reset-db.ts should reseed reference data"
        );
    }
    return model.id;
}

async function insertCarFor(ownerId: string) {
    const [car] = await db
        .insert(cars)
        .values({
            ownerId,
            modelId: await getAnyCarModelId(),
            spz: `RT${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
            countryCode: "SK",
            color: "BLUE",
            seatsTotal: 4,
            isActive: true,
        })
        .returning();
    if (!car) throw new Error("Failed to insert test car");
    return car;
}

function buildCreateRideBody(
    carId: string,
    overrides: Partial<CreateRideBody> = {}
): CreateRideBody {
    const departureAt =
        overrides.departureAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
        carId,
        departureAt,
        arrivalEstimateAt:
            "arrivalEstimateAt" in overrides
                ? overrides.arrivalEstimateAt
                : new Date(departureAt.getTime() + 90 * 60 * 1000),
        durationMinutes: overrides.durationMinutes,
        offeredSeats: overrides.offeredSeats ?? 2,
        currency: overrides.currency ?? "EUR",
        description: overrides.description ?? null,
        stops: overrides.stops ?? [
            {
                address: "Hlavná 1",
                city: "Bratislava",
                countryCode: "SK",
                lat: 48.148,
                lng: 17.107,
                plannedArrivalAt: null,
                plannedDepartureAt: departureAt,
            },
            {
                address: "Námestie SNP 1",
                city: "Banská Bystrica",
                countryCode: "SK",
                lat: 48.736,
                lng: 19.146,
                plannedArrivalAt: new Date(
                    departureAt.getTime() + 90 * 60 * 1000
                ),
                plannedDepartureAt: null,
            },
        ],
        prices: overrides.prices,
    };
}

async function createSignedInUser(
    options?: Parameters<typeof createSignInUser>[0]
) {
    const credentials = await createSignInUser(options);
    const cookie = await signIn(credentials.email, credentials.password);
    return { ...credentials, cookie };
}

function jsonRequest(data: unknown): RequestInit {
    return {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
    };
}

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
            `/rides/search?startLat=48.148&startLng=17.107&destLat=48.736&destLng=19.146&travelDate=${travelDate}`
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual([]);
    });

    it("returns VALIDATION for GET /rides/search with invalid city ids", async () => {
        const response = await apiRequest(
            "/rides/search?startLat=not-a-number&startLng=not-a-number&destLat=also-not-a-number&destLng=also-not-a-number&travelDate=2026-01-01"
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "VALIDATION",
        });
    });
});

describe("RideRoutes protected endpoints", () => {
    it("returns 401 for PATCH /rides/:id/end without a session", async () => {
        const response = await apiRequest(`/rides/${crypto.randomUUID()}/end`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: "{}",
        });

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({
            error: "UNAUTHORIZED",
        });
    });

    it("returns VALIDATION for PATCH /rides/:id/end with an invalid ride id", async () => {
        const { cookie } = await createSignedInUser();

        const response = await authenticatedRequest(
            "/rides/not-a-uuid/end",
            cookie,
            {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: "{}",
            }
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "VALIDATION",
        });
    });

    it("ends a driver's ride through PATCH /rides/:id/end", async () => {
        const { user: driver, cookie } = await createSignedInUser();
        const car = await insertCarFor(driver.id);
        const departureAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id, {
                departureAt,
                arrivalEstimateAt: new Date(
                    departureAt.getTime() + 60 * 60 * 1000
                ),
            })
        );

        const response = await authenticatedRequest(
            `/rides/${rideId}/end`,
            cookie,
            {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ reason: "Finished at destination" }),
            }
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            id: rideId,
            status: "COMPLETED",
        });

        const endedRide = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        expect(endedRide!.rideStatus).toBe("COMPLETED");
        expect(endedRide!.endedByUserId).toBe(driver.id);
        expect(endedRide!.endSource).toBe("DRIVER");
        expect(endedRide!.endReason).toBe("Finished at destination");
    });

    it("returns 404 when a driver tries to end someone else's ride", async () => {
        const owner = await createSignInUser();
        const { cookie: strangerCookie } = await createSignedInUser();
        const car = await insertCarFor(owner.user.id);
        const departureAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const rideId = await RideService.createRide(
            owner.user.id,
            buildCreateRideBody(car.id, {
                departureAt,
                arrivalEstimateAt: new Date(
                    departureAt.getTime() + 60 * 60 * 1000
                ),
            })
        );

        const response = await authenticatedRequest(
            `/rides/${rideId}/end`,
            strangerCookie,
            {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: "{}",
            }
        );

        expect(response.status).toBe(404);
        await expect(response.json()).resolves.toEqual({
            error: RideErrorCodes.RideNotFoundOrNotOwner,
        });
    });

    it("creates a ride through POST /rides for an onboarded user", async () => {
        const { user, cookie } = await createSignedInUser({ onboarded: true });
        const car = await insertCarFor(user.id);
        const body = buildCreateRideBody(car.id);

        const response = await authenticatedRequest(
            "/rides",
            cookie,
            jsonRequest(body)
        );

        expect(response.status).toBe(201);
        const payload = (await response.json()) as { id: string };
        expect(payload.id).toBeTruthy();

        const createdRide = await db.query.rides.findFirst({
            where: eq(rides.id, payload.id),
        });
        expect(createdRide!.driverId).toBe(user.id);
        expect(createdRide!.rideStatus).toBe("PLANNED");
    });

    it("returns 403 when a not-yet-onboarded user posts a ride", async () => {
        const { user, cookie } = await createSignedInUser({
            onboarded: false,
        });
        const car = await insertCarFor(user.id);
        const body = buildCreateRideBody(car.id);

        const response = await authenticatedRequest(
            "/rides",
            cookie,
            jsonRequest(body)
        );

        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toEqual({
            error: "ONBOARDING_REQUIRED",
        });
    });
});
