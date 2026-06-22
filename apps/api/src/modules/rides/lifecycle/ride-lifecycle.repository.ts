import { eq, and, isNull, isNotNull, asc, lte, inArray } from "drizzle-orm";
import type { Executor } from "../../../db";
import { rides as ridesTable } from "../../../db/schema/ride";
import { bookings as bookingsTable } from "../../../db/schema/booking";
import { bookingStatusHistory as bookingStatusHistoryTable } from "../../../db/schema";
import {
    rideNotSoftDeleted,
    bookingNotSoftDeleted,
} from "../ride.repository.shared";
import type { BookingStatus, RideStatus } from "../ride.types";

export const findRideForCancel = async (
    executor: Executor,
    rideId: string,
    driverId: string
) => {
    return await executor.query.rides.findFirst({
        where: and(
            eq(ridesTable.id, rideId),
            eq(ridesTable.driverId, driverId),
            rideNotSoftDeleted
        ),
        columns: { rideStatus: true },
    });
};

export const updateRideStatusToCancelled = async (
    executor: Executor,
    rideId: string,
    driverId: string
): Promise<{ id: string } | null> => {
    const [updatedRide] = await executor
        .update(ridesTable)
        .set({
            rideStatus: "CANCELLED",
        })
        .where(
            and(
                eq(ridesTable.id, rideId),
                eq(ridesTable.driverId, driverId),
                rideNotSoftDeleted
            )
        )
        .returning({ id: ridesTable.id });

    return updatedRide ?? null;
};

export const findActiveBookingsByRideId = async (
    executor: Executor,
    rideId: string
): Promise<{ id: string; bookingStatus: BookingStatus }[]> => {
    return await executor.query.bookings.findMany({
        where: and(
            eq(bookingsTable.rideId, rideId),
            inArray(bookingsTable.bookingStatus, ["PENDING", "CONFIRMED"]),
            bookingNotSoftDeleted
        ),
        columns: { id: true, bookingStatus: true },
    });
};

export const findRideForEnd = async (
    executor: Executor,
    rideId: string,
    driverId?: string
): Promise<{
    id: string;
    rideStatus: RideStatus;
    departureAt: Date;
    endedAt: Date | null;
} | null> => {
    const filters = [eq(ridesTable.id, rideId), rideNotSoftDeleted];
    if (driverId) filters.push(eq(ridesTable.driverId, driverId));

    const ride = await executor.query.rides.findFirst({
        where: and(...filters),
        columns: {
            id: true,
            rideStatus: true,
            departureAt: true,
            endedAt: true,
        },
    });

    return ride ?? null;
};

export const updateRideToEnded = async (
    executor: Executor,
    values: {
        rideId: string;
        driverId?: string;
        endedAt: Date;
        endedByUserId: string | null;
        endSource: NonNullable<(typeof ridesTable.$inferInsert)["endSource"]>;
        endReason: string;
        autoEndProcessedAt: Date | null;
    }
): Promise<{ id: string } | null> => {
    const filters = [
        eq(ridesTable.id, values.rideId),
        inArray(ridesTable.rideStatus, ["PLANNED", "IN_PROGRESS"]),
        rideNotSoftDeleted,
    ];
    if (values.driverId) filters.push(eq(ridesTable.driverId, values.driverId));

    const [updatedRide] = await executor
        .update(ridesTable)
        .set({
            rideStatus: "COMPLETED",
            endedAt: values.endedAt,
            endedByUserId: values.endedByUserId,
            endSource: values.endSource,
            endReason: values.endReason,
            autoEndProcessedAt: values.autoEndProcessedAt,
            updatedAt: values.endedAt,
        })
        .where(and(...filters))
        .returning({ id: ridesTable.id });

    return updatedRide ?? null;
};

export const findConfirmedBookingsByRideId = async (
    executor: Executor,
    rideId: string
): Promise<{ id: string; bookingStatus: BookingStatus }[]> => {
    return await executor.query.bookings.findMany({
        where: and(
            eq(bookingsTable.rideId, rideId),
            eq(bookingsTable.bookingStatus, "CONFIRMED"),
            bookingNotSoftDeleted
        ),
        columns: { id: true, bookingStatus: true },
    });
};

export const findRidesDueForAutoEnd = async (
    executor: Executor,
    now: Date,
    limit: number
): Promise<{ id: string }[]> => {
    return await executor
        .select({ id: ridesTable.id })
        .from(ridesTable)
        .where(
            and(
                rideNotSoftDeleted,
                isNull(ridesTable.endedAt),
                isNotNull(ridesTable.autoEndAt),
                lte(ridesTable.autoEndAt, now),
                inArray(ridesTable.rideStatus, ["PLANNED", "IN_PROGRESS"])
            )
        )
        .orderBy(asc(ridesTable.autoEndAt), asc(ridesTable.id))
        .limit(limit);
};

export const bulkCompleteBookings = async (
    executor: Executor,
    bookingIds: string[]
): Promise<void> => {
    await executor
        .update(bookingsTable)
        .set({ bookingStatus: "COMPLETED" })
        .where(inArray(bookingsTable.id, bookingIds));
};

export const bulkCancelBookings = async (
    executor: Executor,
    bookingIds: string[],
    cancelledByUserId: string,
    cancellationReason: string
): Promise<void> => {
    await executor
        .update(bookingsTable)
        .set({
            bookingStatus: "CANCELLED",
            cancelledAt: new Date(),
            cancelledByUserId,
            cancellationReason,
        })
        .where(inArray(bookingsTable.id, bookingIds));
};

export const bulkInsertBookingStatusHistory = async (
    executor: Executor,
    values: (typeof bookingStatusHistoryTable.$inferInsert)[]
): Promise<void> => {
    await executor.insert(bookingStatusHistoryTable).values(values);
};
