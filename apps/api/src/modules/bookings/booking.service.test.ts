import { describe, it, expect } from "vitest";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db";
import {
    bookings as bookingsTable,
    bookingStatusHistory,
    carModels,
    cars,
    rides as ridesTable,
    rideStops,
    users,
} from "../../db/schema";
import { BookingService } from "./booking.service";
import { BookingError, BookingErrorCodes } from "./booking.errors";
import { RideService } from "../rides/ride.service";
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

async function insertCarFor(ownerId: string) {
    const modelId = await getAnyCarModelId();
    const [car] = await db
        .insert(cars)
        .values({
            ownerId,
            modelId,
            spz: `B${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
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
        arrivalEstimateAt: new Date(departureAt.getTime() + 60 * 60 * 1000),
        offeredSeats: overrides.offeredSeats ?? 3,
        currency: overrides.currency ?? "EUR",
        description: null,
        stops: overrides.stops ?? [
            {
                address: "Hlavná 1",
                city: "Bratislava", countryCode: "SK",
                lat: 48.148,
                lng: 17.107,
                plannedArrivalAt: null,
                plannedDepartureAt: departureAt,
            },
            {
                address: "Námestie SNP 1",
                city: "Banská Bystrica", countryCode: "SK",
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

type RideSetup = {
    driver: Awaited<ReturnType<typeof insertTestUser>>;
    rideId: string;
    pickupStopId: string;
    dropoffStopId: string;
};

// Creates a driver, car, and PLANNED ride with a price for the 0→1 segment.
// Returns the IDs a booking test needs.
async function setupRide(
    overrides: {
        offeredSeats?: number;
        priceAmount?: number;
        withPrice?: boolean;
    } = {}
): Promise<RideSetup> {
    const driver = await insertTestUser();
    const car = await insertCarFor(driver.id);

    const withPrice = overrides.withPrice ?? true;
    const rideId = await RideService.createRide(
        driver.id,
        buildCreateRideBody(car.id, {
            offeredSeats: overrides.offeredSeats ?? 3,
            prices: withPrice
                ? [
                      {
                          startStopOrder: 0,
                          endStopOrder: 1,
                          amount: overrides.priceAmount ?? 500,
                      },
                  ]
                : undefined,
        })
    );

    const stops = await db
        .select({ id: rideStops.id, stopOrder: rideStops.stopOrder })
        .from(rideStops)
        .where(eq(rideStops.rideId, rideId))
        .orderBy(asc(rideStops.stopOrder));

    return {
        driver,
        rideId,
        pickupStopId: stops[0]!.id,
        dropoffStopId: stops[1]!.id,
    };
}

describe("BookingService.createBookingRequest", () => {
    it("creates a PENDING booking with the right total price and a history row", async () => {
        const { rideId, pickupStopId, dropoffStopId } = await setupRide({
            priceAmount: 500,
        });
        const passenger = await insertTestUser();

        const bookingId = await BookingService.createBookingRequest({
            rideId,
            passengerId: passenger.id,
            pickupStopId,
            dropoffStopId,
            seatCount: 2,
        });

        expect(bookingId).toBeTruthy();

        const booking = await db.query.bookings.findFirst({
            where: eq(bookingsTable.id, bookingId),
        });
        expect(booking!.bookingStatus).toBe("PENDING");
        expect(booking!.passengerId).toBe(passenger.id);
        expect(booking!.seatCount).toBe(2);
        // priceAmount * seatCount = 500 * 2.
        expect(booking!.priceAmount).toBe(1000);

        const history = await db
            .select()
            .from(bookingStatusHistory)
            .where(eq(bookingStatusHistory.bookingId, bookingId));
        expect(history).toHaveLength(1);
        expect(history[0]!.newStatus).toBe("PENDING");
        expect(history[0]!.changedByUserId).toBe(passenger.id);
    });

    it("throws SelfBookingNotAllowed when the driver tries to book their own ride", async () => {
        const { driver, rideId, pickupStopId, dropoffStopId } =
            await setupRide();

        await expect(
            BookingService.createBookingRequest({
                rideId,
                passengerId: driver.id,
                pickupStopId,
                dropoffStopId,
                seatCount: 1,
            })
        ).rejects.toMatchObject({
            code: BookingErrorCodes.SelfBookingNotAllowed,
        });
    });

    it("throws RideNotFoundOrUnavailable for an unknown ride id", async () => {
        const { pickupStopId, dropoffStopId } = await setupRide();
        const passenger = await insertTestUser();

        await expect(
            BookingService.createBookingRequest({
                rideId: crypto.randomUUID(),
                passengerId: passenger.id,
                pickupStopId,
                dropoffStopId,
                seatCount: 1,
            })
        ).rejects.toMatchObject({
            code: BookingErrorCodes.RideNotFoundOrUnavailable,
        });
    });

    it("throws RideNotFoundOrUnavailable when the ride is CANCELLED", async () => {
        const { driver, rideId, pickupStopId, dropoffStopId } =
            await setupRide();
        await RideService.cancelRide(rideId, driver.id);
        const passenger = await insertTestUser();

        await expect(
            BookingService.createBookingRequest({
                rideId,
                passengerId: passenger.id,
                pickupStopId,
                dropoffStopId,
                seatCount: 1,
            })
        ).rejects.toMatchObject({
            code: BookingErrorCodes.RideNotFoundOrUnavailable,
        });
    });

    it("throws InvalidStops when pickup and dropoff are in the wrong order", async () => {
        const { rideId, pickupStopId, dropoffStopId } = await setupRide();
        const passenger = await insertTestUser();

        await expect(
            BookingService.createBookingRequest({
                rideId,
                passengerId: passenger.id,
                // Swap them so pickup.stopOrder >= dropoff.stopOrder.
                pickupStopId: dropoffStopId,
                dropoffStopId: pickupStopId,
                seatCount: 1,
            })
        ).rejects.toMatchObject({ code: BookingErrorCodes.InvalidStops });
    });

    it("throws PriceNotFound when the ride has no price for the requested segment", async () => {
        const { rideId, pickupStopId, dropoffStopId } = await setupRide({
            withPrice: false,
        });
        const passenger = await insertTestUser();

        await expect(
            BookingService.createBookingRequest({
                rideId,
                passengerId: passenger.id,
                pickupStopId,
                dropoffStopId,
                seatCount: 1,
            })
        ).rejects.toMatchObject({ code: BookingErrorCodes.PriceNotFound });
    });

    it("throws NotEnoughSeats when the request would exceed offeredSeats (counting PENDING + CONFIRMED)", async () => {
        const { rideId, pickupStopId, dropoffStopId } = await setupRide({
            offeredSeats: 3,
        });
        const passenger1 = await insertTestUser();
        const passenger2 = await insertTestUser();

        // Hold 2 of 3 seats as PENDING.
        await BookingService.createBookingRequest({
            rideId,
            passengerId: passenger1.id,
            pickupStopId,
            dropoffStopId,
            seatCount: 2,
        });

        // 2 (held) + 2 = 4 > 3 → NotEnoughSeats.
        await expect(
            BookingService.createBookingRequest({
                rideId,
                passengerId: passenger2.id,
                pickupStopId,
                dropoffStopId,
                seatCount: 2,
            })
        ).rejects.toMatchObject({ code: BookingErrorCodes.NotEnoughSeats });
    });

    it("throws AlreadyBooked when the same passenger requests twice", async () => {
        const { rideId, pickupStopId, dropoffStopId } = await setupRide();
        const passenger = await insertTestUser();

        await BookingService.createBookingRequest({
            rideId,
            passengerId: passenger.id,
            pickupStopId,
            dropoffStopId,
            seatCount: 1,
        });

        await expect(
            BookingService.createBookingRequest({
                rideId,
                passengerId: passenger.id,
                pickupStopId,
                dropoffStopId,
                seatCount: 1,
            })
        ).rejects.toMatchObject({ code: BookingErrorCodes.AlreadyBooked });
    });
});

describe("BookingService.confirmBooking", () => {
    async function setupPendingBooking(
        seatsOverrides: { offeredSeats?: number; seatCount?: number } = {}
    ) {
        const setup = await setupRide({
            offeredSeats: seatsOverrides.offeredSeats ?? 3,
        });
        const passenger = await insertTestUser();
        const bookingId = await BookingService.createBookingRequest({
            rideId: setup.rideId,
            passengerId: passenger.id,
            pickupStopId: setup.pickupStopId,
            dropoffStopId: setup.dropoffStopId,
            seatCount: seatsOverrides.seatCount ?? 1,
        });
        return { ...setup, passenger, bookingId };
    }

    it("transitions PENDING → CONFIRMED, sets confirmedAt, and writes history", async () => {
        const { driver, bookingId } = await setupPendingBooking();

        const returnedId = await BookingService.confirmBooking(
            bookingId,
            driver.id
        );
        expect(returnedId).toBe(bookingId);

        const booking = await db.query.bookings.findFirst({
            where: eq(bookingsTable.id, bookingId),
        });
        expect(booking!.bookingStatus).toBe("CONFIRMED");
        expect(booking!.confirmedAt).not.toBeNull();

        const history = await db
            .select()
            .from(bookingStatusHistory)
            .where(eq(bookingStatusHistory.bookingId, bookingId));
        // 1 row from create + 1 from confirm = 2.
        expect(history).toHaveLength(2);
        const confirmRow = history.find((h) => h.newStatus === "CONFIRMED");
        expect(confirmRow!.oldStatus).toBe("PENDING");
        expect(confirmRow!.changedByUserId).toBe(driver.id);
    });

    it("throws UnauthorizedAction when another driver tries to confirm", async () => {
        const { bookingId } = await setupPendingBooking();
        const stranger = await insertTestUser();

        await expect(
            BookingService.confirmBooking(bookingId, stranger.id)
        ).rejects.toMatchObject({
            code: BookingErrorCodes.UnauthorizedAction,
        });
    });

    it("throws InvalidStatusTransition on the second confirm", async () => {
        const { driver, bookingId } = await setupPendingBooking();
        await BookingService.confirmBooking(bookingId, driver.id);

        await expect(
            BookingService.confirmBooking(bookingId, driver.id)
        ).rejects.toMatchObject({
            code: BookingErrorCodes.InvalidStatusTransition,
        });
    });

    it("throws NotEnoughSeats when offeredSeats was reduced after the booking was created", async () => {
        // Reachable when a driver shrinks capacity after a passenger has
        // already requested a booking — createBookingRequest can't catch it
        // because the request was valid against the old capacity.
        const setup = await setupRide({ offeredSeats: 3 });
        const passenger = await insertTestUser();
        const bookingId = await BookingService.createBookingRequest({
            rideId: setup.rideId,
            passengerId: passenger.id,
            pickupStopId: setup.pickupStopId,
            dropoffStopId: setup.dropoffStopId,
            seatCount: 2,
        });

        await db
            .update(ridesTable)
            .set({ offeredSeats: 1 })
            .where(eq(ridesTable.id, setup.rideId));

        await expect(
            BookingService.confirmBooking(bookingId, setup.driver.id)
        ).rejects.toMatchObject({ code: BookingErrorCodes.NotEnoughSeats });
    });
});

describe("BookingService.rejectBooking", () => {
    async function setupPendingBooking() {
        const setup = await setupRide();
        const passenger = await insertTestUser();
        const bookingId = await BookingService.createBookingRequest({
            rideId: setup.rideId,
            passengerId: passenger.id,
            pickupStopId: setup.pickupStopId,
            dropoffStopId: setup.dropoffStopId,
            seatCount: 1,
        });
        return { ...setup, passenger, bookingId };
    }

    it("transitions PENDING → REJECTED with the given reason", async () => {
        const { driver, bookingId } = await setupPendingBooking();

        await BookingService.rejectBooking(bookingId, driver.id, "No vacancy");

        const booking = await db.query.bookings.findFirst({
            where: eq(bookingsTable.id, bookingId),
        });
        expect(booking!.bookingStatus).toBe("REJECTED");

        const history = await db
            .select()
            .from(bookingStatusHistory)
            .where(eq(bookingStatusHistory.bookingId, bookingId));
        const rejectRow = history.find((h) => h.newStatus === "REJECTED");
        expect(rejectRow!.reason).toBe("No vacancy");
    });

    it("throws UnauthorizedAction when another driver tries to reject", async () => {
        const { bookingId } = await setupPendingBooking();
        const stranger = await insertTestUser();

        await expect(
            BookingService.rejectBooking(bookingId, stranger.id)
        ).rejects.toMatchObject({
            code: BookingErrorCodes.UnauthorizedAction,
        });
    });
});

describe("BookingService.cancelBookingByPassenger", () => {
    async function setupPendingBooking() {
        const setup = await setupRide();
        const passenger = await insertTestUser();
        const bookingId = await BookingService.createBookingRequest({
            rideId: setup.rideId,
            passengerId: passenger.id,
            pickupStopId: setup.pickupStopId,
            dropoffStopId: setup.dropoffStopId,
            seatCount: 1,
        });
        return { ...setup, passenger, bookingId };
    }

    it("transitions a PENDING booking to CANCELLED with cancellation metadata", async () => {
        const { passenger, bookingId } = await setupPendingBooking();

        await BookingService.cancelBookingByPassenger(
            bookingId,
            passenger.id,
            "Plans changed"
        );

        const booking = await db.query.bookings.findFirst({
            where: eq(bookingsTable.id, bookingId),
        });
        expect(booking!.bookingStatus).toBe("CANCELLED");
        expect(booking!.cancelledAt).not.toBeNull();
        expect(booking!.cancelledByUserId).toBe(passenger.id);
        expect(booking!.cancellationReason).toBe("Plans changed");
    });

    it("throws UnauthorizedAction when a different passenger tries to cancel", async () => {
        const { bookingId } = await setupPendingBooking();
        const stranger = await insertTestUser();

        await expect(
            BookingService.cancelBookingByPassenger(bookingId, stranger.id)
        ).rejects.toMatchObject({
            code: BookingErrorCodes.UnauthorizedAction,
        });
    });

    it("throws AlreadyCancelled on the second cancel", async () => {
        const { passenger, bookingId } = await setupPendingBooking();
        await BookingService.cancelBookingByPassenger(bookingId, passenger.id);

        await expect(
            BookingService.cancelBookingByPassenger(bookingId, passenger.id)
        ).rejects.toMatchObject({
            code: BookingErrorCodes.AlreadyCancelled,
        });
    });
});

describe("BookingService.cancelBookingByDriver", () => {
    it("transitions PENDING → CANCELLED and records the driver as canceller", async () => {
        const setup = await setupRide();
        const passenger = await insertTestUser();
        const bookingId = await BookingService.createBookingRequest({
            rideId: setup.rideId,
            passengerId: passenger.id,
            pickupStopId: setup.pickupStopId,
            dropoffStopId: setup.dropoffStopId,
            seatCount: 1,
        });

        await BookingService.cancelBookingByDriver(
            bookingId,
            setup.driver.id,
            "Reorganising"
        );

        const booking = await db.query.bookings.findFirst({
            where: eq(bookingsTable.id, bookingId),
        });
        expect(booking!.bookingStatus).toBe("CANCELLED");
        expect(booking!.cancelledByUserId).toBe(setup.driver.id);
        expect(booking!.cancellationReason).toBe("Reorganising");
    });
});

void BookingError;
