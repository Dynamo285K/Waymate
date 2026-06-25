import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import {
    bookings as bookingsTable,
    bookingStatusHistory,
    rides as ridesTable,
    users,
} from "../../db/schema";
import { BookingService } from "./booking.service";
import { BookingError, BookingErrorCodes } from "./booking.errors";
import { RideService } from "../rides/ride.service";
import { createRideContext } from "../../../test/factories";

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

describe("BookingService.createBookingRequest", () => {
    it("creates a PENDING booking with the right total price and a history row", async () => {
        const { rideId, pickupStopId, dropoffStopId } = await createRideContext(
            {
                rideOverrides: {
                    prices: [
                        { startStopOrder: 0, endStopOrder: 1, amount: 500 },
                    ],
                },
            }
        );
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
            await createRideContext({
                rideOverrides: {
                    prices: [
                        { startStopOrder: 0, endStopOrder: 1, amount: 500 },
                    ],
                },
            });

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
        const { pickupStopId, dropoffStopId } = await createRideContext({
            rideOverrides: {
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
            },
        });
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
            await createRideContext({
                rideOverrides: {
                    prices: [
                        { startStopOrder: 0, endStopOrder: 1, amount: 500 },
                    ],
                },
            });
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
        const { rideId, pickupStopId, dropoffStopId } = await createRideContext(
            {
                rideOverrides: {
                    prices: [
                        { startStopOrder: 0, endStopOrder: 1, amount: 500 },
                    ],
                },
            }
        );
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
        const { rideId, pickupStopId, dropoffStopId } = await createRideContext(
            {
                rideOverrides: {
                    prices: [],
                },
            }
        );
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

    it("allows creating PENDING requests that exceed offeredSeats (PENDING doesn't consume capacity)", async () => {
        const { rideId, pickupStopId, dropoffStopId } = await createRideContext(
            {
                rideOverrides: {
                    offeredSeats: 3,
                    prices: [
                        { startStopOrder: 0, endStopOrder: 1, amount: 500 },
                    ],
                },
            }
        );
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

        // 2 (held) + 2 = 4 > 3, but PENDING doesn't consume capacity, so it should succeed.
        const bookingId = await BookingService.createBookingRequest({
            rideId,
            passengerId: passenger2.id,
            pickupStopId,
            dropoffStopId,
            seatCount: 2,
        });

        expect(bookingId).toBeTruthy();
    });

    it("throws AlreadyBooked when the same passenger requests twice", async () => {
        const { rideId, pickupStopId, dropoffStopId } = await createRideContext(
            {
                rideOverrides: {
                    prices: [
                        { startStopOrder: 0, endStopOrder: 1, amount: 500 },
                    ],
                },
            }
        );
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
        const setup = await createRideContext({
            rideOverrides: {
                offeredSeats: seatsOverrides.offeredSeats ?? 3,
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
            },
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
        const setup = await createRideContext({
            rideOverrides: {
                offeredSeats: 3,
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
            },
        });
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

    it("auto-rejects remaining PENDING requests if confirming a booking reaches max capacity", async () => {
        const setup = await createRideContext({
            rideOverrides: {
                offeredSeats: 3,
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
            },
        });

        const passenger1 = await insertTestUser();
        const passenger2 = await insertTestUser();
        const passenger3 = await insertTestUser();

        const bookingId1 = await BookingService.createBookingRequest({
            rideId: setup.rideId,
            passengerId: passenger1.id,
            pickupStopId: setup.pickupStopId,
            dropoffStopId: setup.dropoffStopId,
            seatCount: 2,
        });

        const bookingId2 = await BookingService.createBookingRequest({
            rideId: setup.rideId,
            passengerId: passenger2.id,
            pickupStopId: setup.pickupStopId,
            dropoffStopId: setup.dropoffStopId,
            seatCount: 2,
        });

        const bookingId3 = await BookingService.createBookingRequest({
            rideId: setup.rideId,
            passengerId: passenger3.id,
            pickupStopId: setup.pickupStopId,
            dropoffStopId: setup.dropoffStopId,
            seatCount: 1,
        });

        // Confirming passenger1 takes 2 seats out of 3.
        await BookingService.confirmBooking(bookingId1, setup.driver.id);

        // passenger2 wants 2 seats, but only 1 is left. It should be auto-rejected.
        // passenger3 wants 1 seat, and 1 is left. It should NOT be rejected.
        const b2 = await db.query.bookings.findFirst({
            where: eq(bookingsTable.id, bookingId2),
        });
        expect(b2!.bookingStatus).toBe("REJECTED");

        const b3 = await db.query.bookings.findFirst({
            where: eq(bookingsTable.id, bookingId3),
        });
        expect(b3!.bookingStatus).toBe("PENDING");

        // Confirming passenger3 takes the last seat.
        await BookingService.confirmBooking(bookingId3, setup.driver.id);
    });
});

describe("BookingService.rejectBooking", () => {
    async function setupPendingBooking() {
        const setup = await createRideContext({
            rideOverrides: {
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
            },
        });
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
        const setup = await createRideContext({
            rideOverrides: {
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
            },
        });
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
        const setup = await createRideContext({
            rideOverrides: {
                prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
            },
        });
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

describe("BookingService.getPendingRequestsForDriver", () => {
    it("includes a PENDING request for an upcoming PLANNED ride", async () => {
        const { driver, rideId, pickupStopId, dropoffStopId } =
            await createRideContext({
                rideOverrides: {
                    prices: [
                        { startStopOrder: 0, endStopOrder: 1, amount: 500 },
                    ],
                },
            });
        const passenger = await insertTestUser();
        const bookingId = await BookingService.createBookingRequest({
            rideId,
            passengerId: passenger.id,
            pickupStopId,
            dropoffStopId,
            seatCount: 1,
        });

        const requests = await BookingService.getPendingRequestsForDriver(
            driver.id
        );

        expect(requests.map((r) => r.id)).toContain(bookingId);
    });

    it("excludes a PENDING request for a ride whose departure is in the past", async () => {
        const departureAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const { driver, rideId, pickupStopId, dropoffStopId } =
            await createRideContext({
                departureAt,
                rideOverrides: {
                    prices: [
                        { startStopOrder: 0, endStopOrder: 1, amount: 500 },
                    ],
                },
            });
        const passenger = await insertTestUser();

        const bookingId = await BookingService.createBookingRequest({
            rideId,
            passengerId: passenger.id,
            pickupStopId,
            dropoffStopId,
            seatCount: 1,
        });

        const requests = await BookingService.getPendingRequestsForDriver(
            driver.id
        );

        expect(requests.map((r) => r.id)).not.toContain(bookingId);
    });
});

void BookingError;
