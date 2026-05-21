import { describe, it, expect } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import {
    carModels,
    cars,
    rides,
    rideStops,
    prices,
    rideStatusHistory,
    bookings,
    bookingStatusHistory,
    users,
} from "../../db/schema";
import { RideService } from "./ride.service";
import { RideError, RideErrorCodes } from "./ride.errors";
import { TEST_CITY_IDS } from "../../../test/reference-data";
import type { CreateRideBody } from "@repo/shared";

async function insertTestUser() {
    const [user] = await db
        .insert(users)
        .values({
            name: "Test User",
            email: `test-${crypto.randomUUID()}@example.com`,
        })
        .returning();
    if (!user) throw new Error("Failed to insert test user");
    return user;
}

async function getAnyCarModelId(): Promise<number> {
    const [model] = await db.select().from(carModels).limit(1);
    if (!model) {
        throw new Error(
            "car_models is empty — reset-db.ts should reseed reference data"
        );
    }
    return model.id;
}

// Inserts a car directly via Drizzle to avoid coupling ride tests to CarService.
async function insertCarFor(
    ownerId: string,
    overrides: Partial<typeof cars.$inferInsert> = {}
) {
    const modelId = overrides.modelId ?? (await getAnyCarModelId());
    const [car] = await db
        .insert(cars)
        .values({
            ownerId,
            modelId,
            spz:
                overrides.spz ??
                `R${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
            countryCode: overrides.countryCode ?? "SK",
            color: overrides.color ?? "BLUE",
            seatsTotal: overrides.seatsTotal ?? 4,
            isActive: overrides.isActive ?? true,
            deletedAt: overrides.deletedAt ?? null,
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
            overrides.arrivalEstimateAt ??
            new Date(departureAt.getTime() + 60 * 60 * 1000),
        offeredSeats: overrides.offeredSeats ?? 3,
        currency: overrides.currency ?? "EUR",
        description: overrides.description ?? null,
        stops: overrides.stops ?? [
            {
                address: "Hlavná 1",
                cityId: TEST_CITY_IDS.bratislava,
                lat: 48.148,
                lng: 17.107,
                plannedArrivalAt: null,
                plannedDepartureAt: departureAt,
            },
            {
                address: "Námestie SNP 1",
                cityId: TEST_CITY_IDS.banskaBystrica,
                lat: 48.736,
                lng: 19.146,
                plannedArrivalAt: new Date(
                    departureAt.getTime() + 2 * 60 * 60 * 1000
                ),
                plannedDepartureAt: null,
            },
        ],
        prices: overrides.prices,
    };
}

describe("RideService.createRide", () => {
    it("creates a ride with stops, prices, and a status-history row in one transaction", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);

        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id, {
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
            })
        );

        expect(rideId).toBeTruthy();

        const insertedRide = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        expect(insertedRide).toBeDefined();
        expect(insertedRide!.driverId).toBe(driver.id);
        expect(insertedRide!.carId).toBe(car.id);
        expect(insertedRide!.rideStatus).toBe("PLANNED");

        const stops = await db
            .select()
            .from(rideStops)
            .where(eq(rideStops.rideId, rideId));
        expect(stops).toHaveLength(2);
        expect(stops.map((s) => s.stopOrder).sort()).toEqual([0, 1]);

        const ridePrices = await db
            .select()
            .from(prices)
            .where(eq(prices.rideId, rideId));
        expect(ridePrices).toHaveLength(1);
        expect(ridePrices[0]!.amount).toBe(500);

        const history = await db
            .select()
            .from(rideStatusHistory)
            .where(eq(rideStatusHistory.rideId, rideId));
        expect(history).toHaveLength(1);
        expect(history[0]!.newStatus).toBe("PLANNED");
        expect(history[0]!.oldStatus).toBeNull();
        expect(history[0]!.changedByUserId).toBe(driver.id);
    });

    it("works without a prices array (prices are optional)", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);

        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id)
        );

        const ridePrices = await db
            .select()
            .from(prices)
            .where(eq(prices.rideId, rideId));
        expect(ridePrices).toEqual([]);
    });

    it("throws CarNotAvailableForDriver when the car belongs to someone else", async () => {
        const driver = await insertTestUser();
        const stranger = await insertTestUser();
        const car = await insertCarFor(stranger.id);

        await expect(
            RideService.createRide(driver.id, buildCreateRideBody(car.id))
        ).rejects.toMatchObject({
            code: RideErrorCodes.CarNotAvailableForDriver,
        });
    });

    it("throws CarNotAvailableForDriver for an inactive car", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id, { isActive: false });

        await expect(
            RideService.createRide(driver.id, buildCreateRideBody(car.id))
        ).rejects.toMatchObject({
            code: RideErrorCodes.CarNotAvailableForDriver,
        });
    });

    it("throws CarNotAvailableForDriver for a soft-deleted car", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id, { deletedAt: new Date() });

        await expect(
            RideService.createRide(driver.id, buildCreateRideBody(car.id))
        ).rejects.toMatchObject({
            code: RideErrorCodes.CarNotAvailableForDriver,
        });
    });

    it("throws InvalidPriceStopOrders when a price references a stopOrder that doesn't exist", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);

        await expect(
            RideService.createRide(
                driver.id,
                buildCreateRideBody(car.id, {
                    // Only stops 0 and 1 exist; 7 is not a valid stop order.
                    prices: [
                        { startStopOrder: 0, endStopOrder: 7, amount: 500 },
                    ],
                })
            )
        ).rejects.toMatchObject({
            code: RideErrorCodes.InvalidPriceStopOrders,
        });

        // Transaction must have rolled back — no orphan ride, stops, or history.
        const leftoverRides = await db
            .select()
            .from(rides)
            .where(eq(rides.driverId, driver.id));
        expect(leftoverRides).toEqual([]);
    });

    it("throws TooManySeats when offeredSeats exceeds the car's capacity", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id, { seatsTotal: 3 });

        await expect(
            RideService.createRide(
                driver.id,
                buildCreateRideBody(car.id, { offeredSeats: 4 })
            )
        ).rejects.toMatchObject({
            code: RideErrorCodes.TooManySeats,
        });

        // Rolled back — no orphan ride.
        const leftover = await db
            .select()
            .from(rides)
            .where(eq(rides.driverId, driver.id));
        expect(leftover).toEqual([]);
    });

    it("throws UnknownCity when a stop references a city outside the catalog", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const departureAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await expect(
            RideService.createRide(
                driver.id,
                buildCreateRideBody(car.id, {
                    departureAt,
                    stops: [
                        {
                            address: "Hlavná 1",
                            cityId: crypto.randomUUID(),
                            lat: 48.148,
                            lng: 17.107,
                            plannedArrivalAt: null,
                            plannedDepartureAt: departureAt,
                        },
                        {
                            address: "Námestie SNP 1",
                            cityId: TEST_CITY_IDS.banskaBystrica,
                            lat: 48.736,
                            lng: 19.146,
                            plannedArrivalAt: new Date(
                                departureAt.getTime() + 2 * 60 * 60 * 1000
                            ),
                            plannedDepartureAt: null,
                        },
                    ],
                })
            )
        ).rejects.toMatchObject({
            code: RideErrorCodes.UnknownCity,
        });
    });
});

describe("RideService.cancelRide", () => {
    it("cancels a PLANNED ride and writes a status-history row", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id)
        );

        const returnedId = await RideService.cancelRide(
            rideId,
            driver.id,
            "Changed plans"
        );
        expect(returnedId).toBe(rideId);

        const cancelled = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        expect(cancelled!.rideStatus).toBe("CANCELLED");

        const history = await db
            .select()
            .from(rideStatusHistory)
            .where(eq(rideStatusHistory.rideId, rideId));
        // 1 row from create (PLANNED) + 1 row from cancel = 2.
        expect(history).toHaveLength(2);
        const cancelRow = history.find((h) => h.newStatus === "CANCELLED");
        expect(cancelRow).toBeDefined();
        expect(cancelRow!.oldStatus).toBe("PLANNED");
        expect(cancelRow!.reason).toBe("Changed plans");
    });

    it("throws RideNotFoundOrNotOwner when a non-driver tries to cancel", async () => {
        const driver = await insertTestUser();
        const stranger = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id)
        );

        await expect(
            RideService.cancelRide(rideId, stranger.id)
        ).rejects.toMatchObject({
            code: RideErrorCodes.RideNotFoundOrNotOwner,
        });
    });

    it("throws RideNotFoundOrNotOwner for an unknown ride id", async () => {
        const driver = await insertTestUser();

        await expect(
            RideService.cancelRide(crypto.randomUUID(), driver.id)
        ).rejects.toMatchObject({
            code: RideErrorCodes.RideNotFoundOrNotOwner,
        });
    });

    it("throws RideAlreadyCancelled on the second cancel", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id)
        );
        await RideService.cancelRide(rideId, driver.id);

        await expect(
            RideService.cancelRide(rideId, driver.id)
        ).rejects.toMatchObject({
            code: RideErrorCodes.RideAlreadyCancelled,
        });
    });
});

describe("RideService.getDriverRides", () => {
    async function createRideAt(
        driverId: string,
        carId: string,
        departureAt: Date
    ) {
        return RideService.createRide(
            driverId,
            buildCreateRideBody(carId, {
                departureAt,
                arrivalEstimateAt: new Date(
                    departureAt.getTime() + 60 * 60 * 1000
                ),
            })
        );
    }

    it("returns only the driver's own rides", async () => {
        const driver = await insertTestUser();
        const otherDriver = await insertTestUser();
        const driverCar = await insertCarFor(driver.id);
        const otherCar = await insertCarFor(otherDriver.id);

        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const ownRideId = await createRideAt(driver.id, driverCar.id, future);
        await createRideAt(otherDriver.id, otherCar.id, future);

        const result = await RideService.getDriverRides(driver.id, "UPCOMING");
        expect(result.map((r) => r.id)).toEqual([ownRideId]);
    });

    it("splits UPCOMING vs PAST correctly and ALL returns both", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);

        const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const pastRideId = await createRideAt(driver.id, car.id, past);
        const futureRideId = await createRideAt(driver.id, car.id, future);

        const upcoming = await RideService.getDriverRides(
            driver.id,
            "UPCOMING"
        );
        expect(upcoming.map((r) => r.id)).toEqual([futureRideId]);

        const pastRides = await RideService.getDriverRides(driver.id, "PAST");
        expect(pastRides.map((r) => r.id)).toEqual([pastRideId]);

        const all = await RideService.getDriverRides(driver.id, "ALL");
        expect(all.map((r) => r.id).sort()).toEqual(
            [pastRideId, futureRideId].sort()
        );
    });

    it("excludes CANCELLED rides", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const keptId = await createRideAt(driver.id, car.id, future);
        const cancelledId = await createRideAt(driver.id, car.id, future);
        await RideService.cancelRide(cancelledId, driver.id);

        const result = await RideService.getDriverRides(driver.id, "UPCOMING");
        expect(result.map((r) => r.id)).toEqual([keptId]);
    });

    it("excludes soft-deleted rides", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const keptId = await createRideAt(driver.id, car.id, future);
        const deletedId = await createRideAt(driver.id, car.id, future);
        await db
            .update(rides)
            .set({ deletedAt: new Date() })
            .where(and(eq(rides.id, deletedId), eq(rides.driverId, driver.id)));

        const result = await RideService.getDriverRides(driver.id, "UPCOMING");
        expect(result.map((r) => r.id)).toEqual([keptId]);
    });
});

describe("RideService.completeRide", () => {
    const HOUR = 60 * 60 * 1000;

    // Creates a ride that has already departed (so it is eligible to complete)
    // and returns its id plus the ordered stop ids.
    async function createDepartedRide(
        driverId: string,
        carId: string,
        departureAt = new Date(Date.now() - 2 * HOUR)
    ) {
        const rideId = await RideService.createRide(
            driverId,
            buildCreateRideBody(carId, {
                departureAt,
                arrivalEstimateAt: new Date(departureAt.getTime() + HOUR),
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
            })
        );
        const stops = await db
            .select({ id: rideStops.id, stopOrder: rideStops.stopOrder })
            .from(rideStops)
            .where(eq(rideStops.rideId, rideId));
        const ordered = stops.sort((a, b) => a.stopOrder - b.stopOrder);
        return {
            rideId,
            pickupStopId: ordered[0]!.id,
            dropoffStopId: ordered[1]!.id,
        };
    }

    async function insertConfirmedBooking(
        rideId: string,
        passengerId: string,
        pickupStopId: string,
        dropoffStopId: string
    ) {
        const [booking] = await db
            .insert(bookings)
            .values({
                passengerId,
                rideId,
                pickupStopId,
                dropoffStopId,
                seatCount: 1,
                bookingStatus: "CONFIRMED",
                priceAmount: 500,
                currency: "EUR",
                confirmedAt: new Date(),
            })
            .returning();
        if (!booking) throw new Error("Failed to insert booking");
        return booking;
    }

    it("marks a departed PLANNED ride COMPLETED and carries confirmed bookings", async () => {
        const driver = await insertTestUser();
        const passenger = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const { rideId, pickupStopId, dropoffStopId } =
            await createDepartedRide(driver.id, car.id);
        const booking = await insertConfirmedBooking(
            rideId,
            passenger.id,
            pickupStopId,
            dropoffStopId
        );

        const returnedId = await RideService.completeRide(rideId, driver.id);
        expect(returnedId).toBe(rideId);

        const completed = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        expect(completed!.rideStatus).toBe("COMPLETED");

        const updatedBooking = await db.query.bookings.findFirst({
            where: eq(bookings.id, booking.id),
        });
        expect(updatedBooking!.bookingStatus).toBe("COMPLETED");

        const rideHistory = await db
            .select()
            .from(rideStatusHistory)
            .where(eq(rideStatusHistory.rideId, rideId));
        const completeRow = rideHistory.find(
            (h) => h.newStatus === "COMPLETED"
        );
        expect(completeRow!.oldStatus).toBe("PLANNED");
        expect(completeRow!.changedByUserId).toBe(driver.id);

        const bookingHistory = await db
            .select()
            .from(bookingStatusHistory)
            .where(eq(bookingStatusHistory.bookingId, booking.id));
        expect(bookingHistory.some((h) => h.newStatus === "COMPLETED")).toBe(
            true
        );
    });

    it("throws RideNotDeparted for a ride whose departure is still in the future", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id, {
                departureAt: new Date(Date.now() + 24 * HOUR),
            })
        );

        await expect(
            RideService.completeRide(rideId, driver.id)
        ).rejects.toMatchObject({ code: RideErrorCodes.RideNotDeparted });
    });

    it("throws RideAlreadyCompleted on the second complete", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const { rideId } = await createDepartedRide(driver.id, car.id);
        await RideService.completeRide(rideId, driver.id);

        await expect(
            RideService.completeRide(rideId, driver.id)
        ).rejects.toMatchObject({ code: RideErrorCodes.RideAlreadyCompleted });
    });

    it("throws RideNotCompletable for a cancelled ride", async () => {
        const driver = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const { rideId } = await createDepartedRide(driver.id, car.id);
        await RideService.cancelRide(rideId, driver.id);

        await expect(
            RideService.completeRide(rideId, driver.id)
        ).rejects.toMatchObject({ code: RideErrorCodes.RideNotCompletable });
    });

    it("throws RideNotFoundOrNotOwner when a non-owner tries to complete", async () => {
        const driver = await insertTestUser();
        const stranger = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const { rideId } = await createDepartedRide(driver.id, car.id);

        await expect(
            RideService.completeRide(rideId, stranger.id)
        ).rejects.toMatchObject({
            code: RideErrorCodes.RideNotFoundOrNotOwner,
        });
    });
});

// Keep RideError importable in this file for clarity even when only .code is asserted.
void RideError;
