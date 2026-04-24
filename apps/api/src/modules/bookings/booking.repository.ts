import { eq, and, isNull, inArray } from "drizzle-orm";
import { db } from "../../db";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { rides as ridesTable } from "../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../db/schema/ride_stop";
import { prices as pricesTable } from "../../db/schema/price";
import { bookingStatusHistory as bookingStatusHistoryTable } from "../../db/schema";
import { BookingErrors } from "./booking.errors";
import type { CreateBookingInput } from "./booking.types";

/**
 * Creates a booking request from a passenger for a ride.
 * Resolves the ride price and validates the ride, stops, capacity, and duplicate requests inside one transaction.
 */
const createBookingRequest = async (input: CreateBookingInput): Promise<string> => {
    return await db.transaction(async (tx) => {
        // Fetch the ride and lock it for writing.
        const [ride] = await tx
            .select({
                id: ridesTable.id,
                rideStatus: ridesTable.rideStatus,
                offeredSeats: ridesTable.offeredSeats,
            })
            .from(ridesTable)
            .where(and(eq(ridesTable.id, input.rideId), isNull(ridesTable.deletedAt)))
            .for("update");

        if (!ride || ride.rideStatus !== "PLANNED") {
            throw new Error(BookingErrors.RideNotFoundOrUnavailable);
        }

        // Verify that both stops belong to this ride and are in the correct order.
        const stops = await tx
            .select({ id: rideStopsTable.id, stopOrder: rideStopsTable.stopOrder })
            .from(rideStopsTable)
            .where(
                and(
                    eq(rideStopsTable.rideId, input.rideId),
                    inArray(rideStopsTable.id, [input.pickupStopId, input.dropoffStopId])
                )
            );

        if (stops.length !== 2) {
            throw new Error(BookingErrors.InvalidStops);
        }

        const pickup = stops.find((s) => s.id === input.pickupStopId);
        const dropoff = stops.find((s) => s.id === input.dropoffStopId);

        if (!pickup || !dropoff || pickup.stopOrder >= dropoff.stopOrder) {
            throw new Error(BookingErrors.InvalidStops);
        }

        // Resolve the booking price inside the same transaction.
        const [priceRecord] = await tx
            .select({
                amount: pricesTable.amount,
                currency: pricesTable.currency,
            })
            .from(pricesTable)
            .where(
                and(
                    eq(pricesTable.rideId, input.rideId),
                    eq(pricesTable.startStopId, input.pickupStopId),
                    eq(pricesTable.endStopId, input.dropoffStopId)
                )
            );

        if (!priceRecord) {
            throw new Error(BookingErrors.PriceNotFound);
        }

        const totalAmount = priceRecord.amount * input.seatCount;

        // Check the capacity of confirmed bookings.
        const confirmedBookings = await tx
            .select({ seatCount: bookingsTable.seatCount })
            .from(bookingsTable)
            .where(
                and(
                    eq(bookingsTable.rideId, input.rideId),
                    eq(bookingsTable.bookingStatus, "CONFIRMED")
                )
            );

        const currentlyConfirmedSeats = confirmedBookings.reduce((sum, b) => sum + b.seatCount, 0);

        if (currentlyConfirmedSeats + input.seatCount > ride.offeredSeats) {
            throw new Error(BookingErrors.NotEnoughSeats);
        }

        // Prevent duplicate requests from the same passenger.
        const existingBooking = await tx.query.bookings.findFirst({
            where: and(
                eq(bookingsTable.rideId, input.rideId),
                eq(bookingsTable.passengerId, input.passengerId),
                inArray(bookingsTable.bookingStatus, ["PENDING", "CONFIRMED"])
            ),
        });

        if (existingBooking) {
            throw new Error(BookingErrors.AlreadyBooked);
        }

        // Create the booking.
        const [newBooking] = await tx
            .insert(bookingsTable)
            .values({
                passengerId: input.passengerId,
                rideId: input.rideId,
                pickupStopId: input.pickupStopId,
                dropoffStopId: input.dropoffStopId,
                seatCount: input.seatCount,
                priceAmount: totalAmount,
                currency: priceRecord.currency,
                bookingStatus: "PENDING",
            })
            .returning({ id: bookingsTable.id });

        // Record booking history.
        await tx.insert(bookingStatusHistoryTable).values({
            bookingId: newBooking.id,
            newStatus: "PENDING",
            changedByUserId: input.passengerId,
            reason: "Passenger requested booking",
        });

        return newBooking.id;
    });
};

/**
 * 2. Driver confirms the passenger request (PENDING -> CONFIRMED).
 */
const confirmBooking = async (bookingId: string, driverId: string): Promise<string> => {
    return await db.transaction(async (tx) => {
        // Fetch the booking and lock it to prevent race conditions on double submit.
        const [booking] = await tx
            .select()
            .from(bookingsTable)
            .where(eq(bookingsTable.id, bookingId))
            .for("update");

        if (!booking || booking.bookingStatus !== "PENDING") {
            throw new Error(BookingErrors.InvalidStatusTransition);
        }

        // Lock the ride as well so capacity can be recalculated safely.
        const [ride] = await tx
            .select({
                id: ridesTable.id,
                driverId: ridesTable.driverId,
                offeredSeats: ridesTable.offeredSeats,
            })
            .from(ridesTable)
            .where(eq(ridesTable.id, booking.rideId))
            .for("update");

        if (!ride || ride.driverId !== driverId) {
            throw new Error(BookingErrors.UnauthorizedAction);
        }

        const confirmedBookings = await tx
            .select({ seatCount: bookingsTable.seatCount })
            .from(bookingsTable)
            .where(
                and(
                    eq(bookingsTable.rideId, ride.id),
                    eq(bookingsTable.bookingStatus, "CONFIRMED")
                )
            );

        const currentlyConfirmedSeats = confirmedBookings.reduce((sum, b) => sum + b.seatCount, 0);

        if (currentlyConfirmedSeats + booking.seatCount > ride.offeredSeats) {
            throw new Error(BookingErrors.NotEnoughSeats);
        }

        const [updatedBooking] = await tx
            .update(bookingsTable)
            .set({
                bookingStatus: "CONFIRMED",
                confirmedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(bookingsTable.id, bookingId))
            .returning({ id: bookingsTable.id });

        await tx.insert(bookingStatusHistoryTable).values({
            bookingId: updatedBooking.id,
            oldStatus: "PENDING",
            newStatus: "CONFIRMED",
            changedByUserId: driverId,
            reason: "Vodič potvrdil žiadosť o jazdu",
        });

        return updatedBooking.id;
    });
};

/**
 * 3. Driver rejects the passenger request (PENDING -> CANCELLED).
 */
const rejectBooking = async (bookingId: string, driverId: string, reason?: string): Promise<string> => {
    return await db.transaction(async (tx) => {
        // Lock the booking.
        const [booking] = await tx
            .select()
            .from(bookingsTable)
            .where(eq(bookingsTable.id, bookingId))
            .for("update");

        if (!booking || booking.bookingStatus !== "PENDING") {
            throw new Error(BookingErrors.InvalidStatusTransition);
        }

        const [ride] = await tx
            .select({ driverId: ridesTable.driverId })
            .from(ridesTable)
            .where(eq(ridesTable.id, booking.rideId));

        if (!ride || ride.driverId !== driverId) {
            throw new Error(BookingErrors.UnauthorizedAction);
        }

        const rejectionReason = reason || "Vodič zamietol žiadosť";

        const [updatedBooking] = await tx
            .update(bookingsTable)
            .set({
                bookingStatus: "CANCELLED",
                cancelledAt: new Date(),
                cancelledByUserId: driverId,
                cancellationReason: rejectionReason,
                updatedAt: new Date(),
            })
            .where(eq(bookingsTable.id, bookingId))
            .returning({ id: bookingsTable.id });

        await tx.insert(bookingStatusHistoryTable).values({
            bookingId: updatedBooking.id,
            oldStatus: "PENDING",
            newStatus: "CANCELLED",
            changedByUserId: driverId,
            reason: rejectionReason,
        });

        return updatedBooking.id;
    });
};

/**
 * 4. Passenger cancels their own booking (PENDING / CONFIRMED -> CANCELLED).
 */
const cancelBookingByPassenger = async (bookingId: string, passengerId: string, reason?: string): Promise<string> => {
    return await db.transaction(async (tx) => {
        // Lock the booking.
        const [booking] = await tx
            .select()
            .from(bookingsTable)
            .where(eq(bookingsTable.id, bookingId))
            .for("update");

        if (!booking) {
            throw new Error(BookingErrors.BookingNotFound);
        }

        if (booking.passengerId !== passengerId) {
            throw new Error(BookingErrors.UnauthorizedAction);
        }

        if (booking.bookingStatus === "CANCELLED") {
            throw new Error(BookingErrors.AlreadyCancelled);
        }

        const cancelReason = reason || "Pasažier zrušil svoju rezerváciu";

        const [updatedBooking] = await tx
            .update(bookingsTable)
            .set({
                bookingStatus: "CANCELLED",
                cancelledAt: new Date(),
                cancelledByUserId: passengerId,
                cancellationReason: cancelReason,
                updatedAt: new Date(),
            })
            .where(eq(bookingsTable.id, bookingId))
            .returning({ id: bookingsTable.id });

        await tx.insert(bookingStatusHistoryTable).values({
            bookingId: updatedBooking.id,
            oldStatus: booking.bookingStatus,
            newStatus: "CANCELLED",
            changedByUserId: passengerId,
            reason: cancelReason,
        });

        return updatedBooking.id;
    });
};

export const BookingRepository = {
    createBookingRequest,
    confirmBooking,
    rejectBooking,
    cancelBookingByPassenger,
};