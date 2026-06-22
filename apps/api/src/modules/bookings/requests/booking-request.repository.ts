import { eq, and, inArray, sql } from "drizzle-orm";
import * as h3 from "h3-js";
import type { Executor } from "../../../db";
import { bookings as bookingsTable } from "../../../db/schema/booking";
import { rides as ridesTable } from "../../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../../db/schema/ride_stop";
import { prices as pricesTable } from "../../../db/schema/price";
import { rideRouteCells as rideRouteCellsTable } from "../../../db/schema/ride_route_cell";
import {
    bookingNotSoftDeleted,
    rideNotSoftDeleted,
    type RideForBookingContext,
    type BookingRow,
} from "../booking.repository.shared";

export const lockRideForBooking = async (
    executor: Executor,
    rideId: string
): Promise<RideForBookingContext | null> => {
    const [ride] = await executor
        .select({
            id: ridesTable.id,
            driverId: ridesTable.driverId,
            rideStatus: ridesTable.rideStatus,
            offeredSeats: ridesTable.offeredSeats,
        })
        .from(ridesTable)
        .where(and(eq(ridesTable.id, rideId), rideNotSoftDeleted))
        .for("update");

    return ride ?? null;
};

export const findRideStops = async (
    executor: Executor,
    rideId: string,
    stopIds: string[]
): Promise<{ id: string; stopOrder: number }[]> => {
    return await executor
        .select({
            id: rideStopsTable.id,
            stopOrder: rideStopsTable.stopOrder,
        })
        .from(rideStopsTable)
        .where(
            and(
                eq(rideStopsTable.rideId, rideId),
                inArray(rideStopsTable.id, stopIds)
            )
        );
};

export const insertDynamicStop = async (
    executor: Executor,
    rideId: string,
    lat: number,
    lng: number,
    city: string
): Promise<string> => {
    const [newStop] = await executor
        .insert(rideStopsTable)
        .values({
            rideId,
            lat,
            lng,
            city,
            address: city,
            countryCode: "SK", // default for now
            h3Res7: h3.latLngToCell(lat, lng, 7),
            h3Res8: h3.latLngToCell(lat, lng, 8),
            stopOrder: 999999, // temporary, will be reordered below
            isDynamic: true,
        })
        .returning({ id: rideStopsTable.id });

    // Fetch all stops, find their closest point order, and sort them
    const allStops = await executor
        .select()
        .from(rideStopsTable)
        .where(eq(rideStopsTable.rideId, rideId));

    const stopsWithOrder = await Promise.all(
        allStops.map(async (stop) => {
            const [firstResult] = await executor
                .select({
                    pointOrder: rideRouteCellsTable.pointOrder,
                })
                .from(rideRouteCellsTable)
                .where(eq(rideRouteCellsTable.rideId, rideId))
                .orderBy(
                    sql`6371 * acos(least(1.0, cos(radians(${stop.lat})) * cos(radians(${rideRouteCellsTable.lat})) * cos(radians(${rideRouteCellsTable.lng}) - radians(${stop.lng})) + sin(radians(${stop.lat})) * sin(radians(${rideRouteCellsTable.lat})))) ASC`
                )
                .limit(1);

            return {
                id: stop.id,
                pointOrder: firstResult?.pointOrder ?? stop.stopOrder,
            };
        })
    );

    stopsWithOrder.sort((a, b) => a.pointOrder - b.pointOrder);

    // Two-pass update to avoid unique constraint conflicts on stop_order:
    // first shift all to high temporary values, then set the real ones.
    for (let i = 0; i < stopsWithOrder.length; i++) {
        await executor
            .update(rideStopsTable)
            .set({ stopOrder: 100000 + i })
            .where(eq(rideStopsTable.id, stopsWithOrder[i].id));
    }
    for (let i = 0; i < stopsWithOrder.length; i++) {
        await executor
            .update(rideStopsTable)
            .set({ stopOrder: i })
            .where(eq(rideStopsTable.id, stopsWithOrder[i].id));
    }

    return newStop.id;
};

export const findSegmentPrice = async (
    executor: Executor,
    rideId: string,
    startStopId: string,
    endStopId: string
): Promise<{ amount: number; currency: string } | null> => {
    const [price] = await executor
        .select({
            amount: pricesTable.amount,
            currency: pricesTable.currency,
        })
        .from(pricesTable)
        .where(
            and(
                eq(pricesTable.rideId, rideId),
                eq(pricesTable.startStopId, startStopId),
                eq(pricesTable.endStopId, endStopId)
            )
        );

    return price ?? null;
};

export const findActiveBookingByPassenger = async (
    executor: Executor,
    rideId: string,
    passengerId: string
): Promise<BookingRow | undefined> => {
    return await executor.query.bookings.findFirst({
        where: and(
            eq(bookingsTable.rideId, rideId),
            eq(bookingsTable.passengerId, passengerId),
            inArray(bookingsTable.bookingStatus, ["PENDING", "CONFIRMED"]),
            bookingNotSoftDeleted
        ),
    });
};

export const insertBooking = async (
    executor: Executor,
    values: {
        passengerId: string;
        rideId: string;
        pickupStopId: string;
        dropoffStopId: string;
        requestedPickupCity?: string | null;
        requestedDropoffCity?: string | null;
        seatCount: number;
        priceAmount: number;
        currency: string;
    }
): Promise<{ id: string }> => {
    const [newBooking] = await executor
        .insert(bookingsTable)
        .values({
            ...values,
            bookingStatus: "PENDING",
        })
        .returning({ id: bookingsTable.id });

    return newBooking;
};
