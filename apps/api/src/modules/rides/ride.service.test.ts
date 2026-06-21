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
import { CreateRideBodySchema, type CreateRideBody } from "@repo/shared";
import { vi } from "vitest";
import { fetchOsrmRouteCells } from "./osrm.service";
import { createTestCar, buildRideBody } from "../../../test/factories";

vi.mock("./osrm.service", () => ({
    fetchOsrmRouteCells: vi
        .fn()
        .mockResolvedValue({ cells: [], durations: [3600] }),
}));

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


function buildCreateRideBody(
    carId: string,
    overrides: Partial<CreateRideBody> = {}
): CreateRideBody {
    return buildRideBody(
        carId,
        overrides.departureAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
        overrides
    );
}

// Mirrors AUTO_END_BUFFER_MS in ride.service.ts: a ride auto-ends one hour
// after its expected arrival, so autoEndAt = arrival + 1h.
const AUTO_END_BUFFER_MS = 60 * 60 * 1000;

describe("RideService.createRide", () => {
    it("creates a ride with stops, prices, and a status-history row in one transaction", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const body = buildCreateRideBody(car.id, {
            prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
        });

        const rideId = await RideService.createRide(driver.id, body);

        expect(rideId).toBeTruthy();

        const insertedRide = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        expect(insertedRide).toBeDefined();
        expect(insertedRide!.driverId).toBe(driver.id);
        expect(insertedRide!.carId).toBe(car.id);
        expect(insertedRide!.rideStatus).toBe("PLANNED");
        expect(insertedRide!.autoEndAt?.getTime()).toBe(
            body.arrivalEstimateAt!.getTime() + AUTO_END_BUFFER_MS
        );

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

    it("resolves arrivalEstimateAt from OSRM durations when neither arrivalEstimateAt nor durationMinutes is supplied", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const departureAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id, {
                departureAt,
                arrivalEstimateAt: null,
                stops: [
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
                        plannedArrivalAt: null,
                        plannedDepartureAt: null,
                    },
                ],
            })
        );

        const insertedRide = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });

        // Mocked OSRM returns a single 3600s leg duration → +1h from
        // departure, rounded to the nearest minute (see resolveArrivalEstimateAt).
        const expectedArrival = new Date(
            Math.round((departureAt.getTime() + 3600 * 1000) / 60_000) * 60_000
        );
        expect(insertedRide!.arrivalEstimateAt?.getTime()).toBe(
            expectedArrival.getTime()
        );
        expect(insertedRide!.autoEndAt?.getTime()).toBe(
            expectedArrival.getTime() + AUTO_END_BUFFER_MS
        );
    });

    it("falls back to the last stop's plannedArrivalAt for autoEndAt when OSRM returns no durations", async () => {
        vi.mocked(fetchOsrmRouteCells).mockResolvedValueOnce({
            cells: [],
            durations: [],
        });

        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const departureAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const plannedArrivalAt = new Date(
            departureAt.getTime() + 2 * 60 * 60 * 1000
        );

        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id, {
                departureAt,
                arrivalEstimateAt: null,
                stops: [
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
                        plannedArrivalAt,
                        plannedDepartureAt: null,
                    },
                ],
            })
        );

        const insertedRide = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });

        expect(insertedRide!.arrivalEstimateAt).toBeNull();
        expect(insertedRide!.autoEndAt?.getTime()).toBe(
            plannedArrivalAt.getTime() + AUTO_END_BUFFER_MS
        );
    });

    it("works without a prices array (prices are optional)", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);

        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id, { prices: undefined })
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
        const car = await createTestCar(stranger.id);

        await expect(
            RideService.createRide(driver.id, buildCreateRideBody(car.id))
        ).rejects.toMatchObject({
            code: RideErrorCodes.CarNotAvailableForDriver,
        });
    });

    it("throws CarNotAvailableForDriver for an inactive car", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id, { isActive: false });

        await expect(
            RideService.createRide(driver.id, buildCreateRideBody(car.id))
        ).rejects.toMatchObject({
            code: RideErrorCodes.CarNotAvailableForDriver,
        });
    });

    it("throws CarNotAvailableForDriver for a soft-deleted car", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id, { deletedAt: new Date() });

        await expect(
            RideService.createRide(driver.id, buildCreateRideBody(car.id))
        ).rejects.toMatchObject({
            code: RideErrorCodes.CarNotAvailableForDriver,
        });
    });

    it("throws InvalidPriceStopOrders when a price references a stopOrder that doesn't exist", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);

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
        const car = await createTestCar(driver.id, { seatsTotal: 3 });

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
});

describe("RideService.createRide — arrival from duration", () => {
    it("resolves durationMinutes into an absolute arrivalEstimateAt and autoEndAt", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const departureAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id, {
                departureAt,
                // Arrival is expressed purely as a duration here.
                arrivalEstimateAt: null,
                durationMinutes: 150,
            })
        );

        const ride = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        const expectedArrival = new Date(
            departureAt.getTime() + 150 * 60 * 1000
        );
        expect(ride!.arrivalEstimateAt?.getTime()).toBe(
            expectedArrival.getTime()
        );
        // autoEndAt is the resolved arrival plus the 1-hour buffer.
        expect(ride!.autoEndAt?.getTime()).toBe(
            expectedArrival.getTime() + AUTO_END_BUFFER_MS
        );
    });
});

describe("CreateRideBodySchema — arrival input", () => {
    const baseBody = () => ({
        carId: crypto.randomUUID(),
        departureAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        offeredSeats: 3,
        currency: "EUR",
        stops: [
            {
                city: "Bratislava",
                countryCode: "SK",
                address: "Hlavná 1",
                lat: 48.148,
                lng: 17.107,
            },
            {
                city: "Banská Bystrica",
                countryCode: "SK",
                address: "Námestie SNP 1",
                lat: 48.736,
                lng: 19.146,
            },
        ],
    });

    it("accepts a body that supplies only durationMinutes", () => {
        const result = CreateRideBodySchema.safeParse({
            ...baseBody(),
            durationMinutes: 120,
        });
        expect(result.success).toBe(true);
    });

    it("rejects a body that supplies both arrivalEstimateAt and durationMinutes", () => {
        const result = CreateRideBodySchema.safeParse({
            ...baseBody(),
            arrivalEstimateAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
            durationMinutes: 120,
        });
        expect(result.success).toBe(false);
    });
});

describe("RideService.cancelRide", () => {
    it("cancels a PLANNED ride and writes a status-history row", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
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
        const car = await createTestCar(driver.id);
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
        const car = await createTestCar(driver.id);
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
        const driverCar = await createTestCar(driver.id);
        const otherCar = await createTestCar(otherDriver.id);

        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const ownRideId = await createRideAt(driver.id, driverCar.id, future);
        await createRideAt(otherDriver.id, otherCar.id, future);

        const result = await RideService.getDriverRides(driver.id, "UPCOMING");
        expect(result.map((r) => r.id)).toEqual([ownRideId]);
    });

    it("splits UPCOMING vs PAST by status and ALL returns both", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);

        // The list splits on ride status, not departure time: a COMPLETED ride
        // is PAST, anything not-yet-completed (PLANNED/IN_PROGRESS) is UPCOMING.
        const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const completedRideId = await createRideAt(driver.id, car.id, past);
        await RideService.completeRide(completedRideId, driver.id);
        const plannedRideId = await createRideAt(driver.id, car.id, future);

        const upcoming = await RideService.getDriverRides(
            driver.id,
            "UPCOMING"
        );
        expect(upcoming.map((r) => r.id)).toEqual([plannedRideId]);

        const pastRides = await RideService.getDriverRides(driver.id, "PAST");
        expect(pastRides.map((r) => r.id)).toEqual([completedRideId]);

        const all = await RideService.getDriverRides(driver.id, "ALL");
        expect(all.map((r) => r.id).sort()).toEqual(
            [completedRideId, plannedRideId].sort()
        );
    });

    it("excludes CANCELLED rides", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const keptId = await createRideAt(driver.id, car.id, future);
        const cancelledId = await createRideAt(
            driver.id,
            car.id,
            new Date(future.getTime() + 2 * 60 * 60 * 1000)
        );
        await RideService.cancelRide(cancelledId, driver.id);

        const result = await RideService.getDriverRides(driver.id, "UPCOMING");
        expect(result.map((r) => r.id)).toEqual([keptId]);
    });

    it("excludes soft-deleted rides", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const keptId = await createRideAt(driver.id, car.id, future);
        const deletedId = await createRideAt(
            driver.id,
            car.id,
            new Date(future.getTime() + 2 * 60 * 60 * 1000)
        );
        await db
            .update(rides)
            .set({ deletedAt: new Date() })
            .where(and(eq(rides.id, deletedId), eq(rides.driverId, driver.id)));

        const result = await RideService.getDriverRides(driver.id, "UPCOMING");
        expect(result.map((r) => r.id)).toEqual([keptId]);
    });
});

describe("RideService ride termination", () => {
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

    it("manually ends a departed PLANNED ride and carries confirmed bookings", async () => {
        const driver = await insertTestUser();
        const passenger = await insertTestUser();
        const car = await createTestCar(driver.id);
        const { rideId, pickupStopId, dropoffStopId } =
            await createDepartedRide(driver.id, car.id);
        const booking = await insertConfirmedBooking(
            rideId,
            passenger.id,
            pickupStopId,
            dropoffStopId
        );
        const beforeEnd = new Date();

        const returnedId = await RideService.endRide({
            rideId,
            actorUserId: driver.id,
            source: "DRIVER",
        });
        expect(returnedId).toBe(rideId);

        const completed = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        expect(completed!.rideStatus).toBe("COMPLETED");
        expect(completed!.endedAt!.getTime()).toBeGreaterThanOrEqual(
            beforeEnd.getTime()
        );
        expect(completed!.endedByUserId).toBe(driver.id);
        expect(completed!.endSource).toBe("DRIVER");
        expect(completed!.endReason).toBe("Ride ended by driver");
        expect(completed!.autoEndProcessedAt).toBeNull();

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
        expect(completeRow!.reason).toBe("Ride ended by driver");

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
        const car = await createTestCar(driver.id);
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

    it("is idempotent on the second end and does not duplicate history", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const { rideId } = await createDepartedRide(driver.id, car.id);
        const firstReturnedId = await RideService.endRide({
            rideId,
            actorUserId: driver.id,
            source: "DRIVER",
        });
        const firstEndedRide = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });

        const secondReturnedId = await RideService.endRide({
            rideId,
            actorUserId: driver.id,
            source: "DRIVER",
        });

        expect(firstReturnedId).toBe(rideId);
        expect(secondReturnedId).toBe(rideId);

        const endedRide = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        expect(endedRide!.endedAt!.getTime()).toBe(
            firstEndedRide!.endedAt!.getTime()
        );

        const rideHistory = await db
            .select()
            .from(rideStatusHistory)
            .where(eq(rideStatusHistory.rideId, rideId));
        expect(
            rideHistory.filter((h) => h.newStatus === "COMPLETED")
        ).toHaveLength(1);
    });

    it("allows the system to end a departed ride without a user actor", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const { rideId } = await createDepartedRide(driver.id, car.id);
        const endedAt = new Date();

        const returnedId = await RideService.endRide({
            rideId,
            source: "AUTO",
            endedAt,
        });

        expect(returnedId).toBe(rideId);

        const endedRide = await db.query.rides.findFirst({
            where: eq(rides.id, rideId),
        });
        expect(endedRide!.rideStatus).toBe("COMPLETED");
        expect(endedRide!.endedAt!.getTime()).toBe(endedAt.getTime());
        expect(endedRide!.endedByUserId).toBeNull();
        expect(endedRide!.endSource).toBe("AUTO");
        expect(endedRide!.autoEndProcessedAt!.getTime()).toBe(
            endedAt.getTime()
        );

        const rideHistory = await db
            .select()
            .from(rideStatusHistory)
            .where(eq(rideStatusHistory.rideId, rideId));
        const completeRow = rideHistory.find(
            (h) => h.newStatus === "COMPLETED"
        );
        expect(completeRow!.changedByUserId).toBeNull();
        expect(completeRow!.reason).toBe("Ride ended automatically");
    });

    it("autoEndExpiredRides ends only active rides whose autoEndAt has expired", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const now = new Date();
        const { rideId: expiredRideId } = await createDepartedRide(
            driver.id,
            car.id,
            new Date(now.getTime() - 2 * HOUR)
        );
        const driver2 = await insertTestUser();
        const car2 = await createTestCar(driver2.id);
        const futureAutoEndRideId = await RideService.createRide(
            driver2.id,
            buildCreateRideBody(car2.id, {
                departureAt: new Date(now.getTime() - HOUR),
                arrivalEstimateAt: new Date(now.getTime() + HOUR),
            })
        );

        const result = await RideService.autoEndExpiredRides({
            now,
            limit: 10,
        });

        expect(result).toMatchObject({
            candidates: 1,
            processed: 1,
            failed: 0,
            failures: [],
        });

        const expiredRide = await db.query.rides.findFirst({
            where: eq(rides.id, expiredRideId),
        });
        expect(expiredRide!.rideStatus).toBe("COMPLETED");
        expect(expiredRide!.endSource).toBe("AUTO");
        expect(expiredRide!.endedByUserId).toBeNull();
        expect(expiredRide!.endedAt!.getTime()).toBe(now.getTime());
        expect(expiredRide!.autoEndProcessedAt!.getTime()).toBe(now.getTime());

        const futureAutoEndRide = await db.query.rides.findFirst({
            where: eq(rides.id, futureAutoEndRideId),
        });
        expect(futureAutoEndRide!.rideStatus).toBe("PLANNED");
        expect(futureAutoEndRide!.endedAt).toBeNull();
    });

    it("autoEndExpiredRides does not duplicate termination or history on repeated runs", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const now = new Date();
        const { rideId } = await createDepartedRide(
            driver.id,
            car.id,
            new Date(now.getTime() - 2 * HOUR)
        );

        const firstRun = await RideService.autoEndExpiredRides({
            now,
            limit: 10,
        });
        const secondRun = await RideService.autoEndExpiredRides({
            now: new Date(now.getTime() + HOUR),
            limit: 10,
        });

        expect(firstRun.processed).toBe(1);
        expect(secondRun).toMatchObject({
            candidates: 0,
            processed: 0,
            failed: 0,
            failures: [],
        });

        const rideHistory = await db
            .select()
            .from(rideStatusHistory)
            .where(eq(rideStatusHistory.rideId, rideId));
        expect(
            rideHistory.filter((h) => h.newStatus === "COMPLETED")
        ).toHaveLength(1);
    });

    it("throws RideNotCompletable for a cancelled ride", async () => {
        const driver = await insertTestUser();
        const car = await createTestCar(driver.id);
        const { rideId } = await createDepartedRide(driver.id, car.id);
        await RideService.cancelRide(rideId, driver.id);

        await expect(
            RideService.completeRide(rideId, driver.id)
        ).rejects.toMatchObject({ code: RideErrorCodes.RideNotCompletable });
    });

    it("throws RideNotFoundOrNotOwner when a non-owner tries to complete", async () => {
        const driver = await insertTestUser();
        const stranger = await insertTestUser();
        const car = await createTestCar(driver.id);
        const { rideId } = await createDepartedRide(driver.id, car.id);

        await expect(
            RideService.completeRide(rideId, stranger.id)
        ).rejects.toMatchObject({
            code: RideErrorCodes.RideNotFoundOrNotOwner,
        });
    });
});

describe("RideService.getRidePassengers", () => {
    it("returns each passenger's own segment price, not the full-route price", async () => {
        const driver = await insertTestUser();
        const passengerA = await insertTestUser();
        const passengerB = await insertTestUser();
        const car = await createTestCar(driver.id);

        const departureAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const rideId = await RideService.createRide(
            driver.id,
            buildCreateRideBody(car.id, {
                departureAt,
                arrivalEstimateAt: new Date(
                    departureAt.getTime() + 2 * 60 * 60 * 1000
                ),
                stops: [
                    {
                        address: "Martin",
                        city: "Martin",
                        countryCode: "SK",
                        lat: 49.065,
                        lng: 18.922,
                        plannedArrivalAt: null,
                        plannedDepartureAt: departureAt,
                    },
                    {
                        address: "Trenčín",
                        city: "Trenčín",
                        countryCode: "SK",
                        lat: 48.894,
                        lng: 18.045,
                        plannedArrivalAt: new Date(
                            departureAt.getTime() + 60 * 60 * 1000
                        ),
                        plannedDepartureAt: new Date(
                            departureAt.getTime() + 60 * 60 * 1000
                        ),
                    },
                    {
                        address: "Žilina",
                        city: "Žilina",
                        countryCode: "SK",
                        lat: 49.223,
                        lng: 18.739,
                        plannedArrivalAt: new Date(
                            departureAt.getTime() + 2 * 60 * 60 * 1000
                        ),
                        plannedDepartureAt: null,
                    },
                ],
                prices: [
                    { startStopOrder: 0, endStopOrder: 1, amount: 800 },
                    { startStopOrder: 0, endStopOrder: 2, amount: 2000 },
                ],
            })
        );

        const stops = (
            await db
                .select({ id: rideStops.id, stopOrder: rideStops.stopOrder })
                .from(rideStops)
                .where(eq(rideStops.rideId, rideId))
        ).sort((a, b) => a.stopOrder - b.stopOrder);
        const [origin, mid, destination] = stops;

        // Passenger A books the full route; passenger B only the first segment.
        await db.insert(bookings).values([
            {
                passengerId: passengerA.id,
                rideId,
                pickupStopId: origin!.id,
                dropoffStopId: destination!.id,
                seatCount: 1,
                bookingStatus: "CONFIRMED",
                priceAmount: 2000,
                currency: "EUR",
                confirmedAt: new Date(),
            },
            {
                passengerId: passengerB.id,
                rideId,
                pickupStopId: origin!.id,
                dropoffStopId: mid!.id,
                seatCount: 1,
                bookingStatus: "CONFIRMED",
                priceAmount: 800,
                currency: "EUR",
                confirmedAt: new Date(),
            },
        ]);

        const view = await RideService.getRidePassengers(rideId, driver.id);

        const byPassenger = new Map(
            view.passengers.map((p) => [p.passenger.id, p])
        );
        expect(byPassenger.get(passengerA.id)).toMatchObject({
            priceAmount: 2000,
            currency: "EUR",
        });
        expect(byPassenger.get(passengerB.id)).toMatchObject({
            priceAmount: 800,
            currency: "EUR",
        });

        const totalEarned = view.passengers.reduce(
            (sum, p) => sum + p.priceAmount,
            0
        );
        // Sum of actual segment prices, not 2 × full-route price (4000).
        expect(totalEarned).toBe(2800);
    });
});

// Keep RideError importable in this file for clarity even when only .code is asserted.
void RideError;
