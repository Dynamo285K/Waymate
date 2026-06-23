import { describe, expect, it } from "vitest";
import { mapRidesToDisplayed } from "./driver-ride-view";
import type { RideListItem } from "../../../../api-client/model/rideListItem";

function makeRide(overrides: Partial<RideListItem> = {}): RideListItem {
    return {
        id: "r1",
        driverId: "d1",
        carId: "c1",
        rideStatus: "PLANNED",
        departureAt: "2026-01-01T08:00:00.000Z",
        arrivalEstimateAt: "2026-01-01T10:00:00.000Z",
        autoEndAt: null,
        endedAt: null,
        endedByUserId: null,
        endSource: null,
        endReason: null,
        autoEndProcessedAt: null,
        offeredSeats: 4,
        currency: "EUR",
        description: null,
        createdAt: "2025-12-01T00:00:00.000Z",
        updatedAt: "2025-12-01T00:00:00.000Z",
        deletedAt: null,
        rideStops: [
            { city: "Bratislava", stopOrder: 0 },
            { city: "Košice", stopOrder: 1 },
        ],
        bookings: [],
        prices: [
            {
                amount: 15,
                currency: "EUR",
                startStopId: "s0",
                endStopId: "s1",
            },
        ],
        ...overrides,
    };
}

describe("mapRidesToDisplayed", () => {
    it("returns an empty array when rides are undefined", () => {
        expect(mapRidesToDisplayed(undefined)).toEqual([]);
    });

    it("derives origin/destination from the stop order, not array order", () => {
        const [ride] = mapRidesToDisplayed([
            makeRide({
                rideStops: [
                    { city: "Košice", stopOrder: 1 },
                    { city: "Bratislava", stopOrder: 0 },
                ],
            }),
        ]);
        expect(ride.from).toBe("Bratislava");
        expect(ride.to).toBe("Košice");
    });

    it("subtracts confirmed seats from the offered seats", () => {
        const [ride] = mapRidesToDisplayed([
            makeRide({
                offeredSeats: 4,
                bookings: [
                    { id: "b1", seatCount: 1 },
                    { id: "b2", seatCount: 2 },
                ],
            }),
        ]);
        expect(ride.seatsLeft).toBe(1);
    });

    it("reports 'full' when no seats remain", () => {
        const [ride] = mapRidesToDisplayed([
            makeRide({
                offeredSeats: 2,
                bookings: [{ id: "b1", seatCount: 2 }],
            }),
        ]);
        expect(ride.seatsLeft).toBe("full");
    });

    it("takes the price from the first price row, or 0 when there is none", () => {
        const [withPrice] = mapRidesToDisplayed([makeRide()]);
        expect(withPrice.price).toBe(15);

        const [noPrice] = mapRidesToDisplayed([makeRide({ prices: [] })]);
        expect(noPrice.price).toBe(0);
    });

    it("carries the ride status and a formatted duration", () => {
        const [ride] = mapRidesToDisplayed([
            makeRide({ rideStatus: "COMPLETED" }),
        ]);
        expect(ride.rideStatus).toBe("COMPLETED");
        expect(ride.duration).toBe("2h");
    });

    it("falls back to empty origin/destination when there are no stops", () => {
        const [ride] = mapRidesToDisplayed([makeRide({ rideStops: [] })]);
        expect(ride.from).toBe("");
        expect(ride.to).toBe("");
    });
});
