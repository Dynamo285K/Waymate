import { eq, and } from "drizzle-orm";
import type { Executor } from "../../../db";
import { bookings as bookingsTable } from "../../../db/schema/booking";
import { bookingStatusHistory as bookingStatusHistoryTable } from "../../../db/schema";
import {
    bookingNotSoftDeleted,
    type BookingRow,
} from "../booking.repository.shared";
import type { BookingStatus } from "../booking.types";

export const lockBookingById = async (
    executor: Executor,
    bookingId: string
): Promise<BookingRow | null> => {
    const [booking] = await executor
        .select()
        .from(bookingsTable)
        .where(and(eq(bookingsTable.id, bookingId), bookingNotSoftDeleted))
        .for("update");

    return booking ?? null;
};

export const findPendingBookingsForRide = async (
    executor: Executor,
    rideId: string
): Promise<BookingRow[]> => {
    return await executor
        .select()
        .from(bookingsTable)
        .where(
            and(
                eq(bookingsTable.rideId, rideId),
                eq(bookingsTable.bookingStatus, "PENDING"),
                bookingNotSoftDeleted
            )
        );
};

// Whitelisted update surface for booking status transitions.
type BookingTransitionFields = Partial<
    Pick<
        typeof bookingsTable.$inferInsert,
        | "bookingStatus"
        | "confirmedAt"
        | "cancelledAt"
        | "cancelledByUserId"
        | "cancellationReason"
    >
>;

export const updateBookingFields = async (
    executor: Executor,
    bookingId: string,
    fields: BookingTransitionFields
): Promise<{ id: string } | null> => {
    const [updatedBooking] = await executor
        .update(bookingsTable)
        .set(fields)
        .where(and(eq(bookingsTable.id, bookingId), bookingNotSoftDeleted))
        .returning({ id: bookingsTable.id });

    return updatedBooking ?? null;
};

export const insertBookingStatusHistory = async (
    executor: Executor,
    values: {
        bookingId: string;
        oldStatus?: BookingStatus;
        newStatus: BookingStatus;
        changedByUserId: string;
        reason: string;
    }
): Promise<void> => {
    await executor.insert(bookingStatusHistoryTable).values(values);
};
