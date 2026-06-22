import { eq, and, or, isNull, gte, lt, inArray } from "drizzle-orm";
import type { Executor } from "../../../db";
import { rides as ridesTable } from "../../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../../db/schema/ride_stop";
import { prices as pricesTable } from "../../../db/schema/price";
import { rideRouteCells as rideRouteCellsTable } from "../../../db/schema/ride_route_cell";
import { rideStatusHistory as rideStatusHistoryTable } from "../../../db/schema/ride_status_history";
import { cars as carsTable } from "../../../db/schema/car";
import {
    rideNotSoftDeleted,
    carNotSoftDeleted,
} from "../ride.repository.shared";

export const findActiveCarForDriver = async (
    executor: Executor,
    carId: string,
    driverId: string
) => {
    return await executor.query.cars.findFirst({
        where: and(
            eq(carsTable.id, carId),
            eq(carsTable.ownerId, driverId),
            eq(carsTable.isActive, true),
            carNotSoftDeleted
        ),
    });
};

export const insertRide = async (
    executor: Executor,
    values: typeof ridesTable.$inferInsert
) => {
    const [newRide] = await executor
        .insert(ridesTable)
        .values(values)
        .returning({
            id: ridesTable.id,
            currency: ridesTable.currency,
            rideStatus: ridesTable.rideStatus,
        });

    return newRide;
};

export const insertRideStops = async (
    executor: Executor,
    values: (typeof rideStopsTable.$inferInsert)[]
) => {
    return await executor.insert(rideStopsTable).values(values).returning({
        id: rideStopsTable.id,
        stopOrder: rideStopsTable.stopOrder,
    });
};

export const insertRideRouteCells = async (
    executor: Executor,
    values: (typeof rideRouteCellsTable.$inferInsert)[]
): Promise<void> => {
    if (values.length === 0) return;
    await executor.insert(rideRouteCellsTable).values(values);
};

export const insertRidePrices = async (
    executor: Executor,
    values: (typeof pricesTable.$inferInsert)[]
): Promise<void> => {
    await executor.insert(pricesTable).values(values);
};

export const insertRideStatusHistory = async (
    executor: Executor,
    values: typeof rideStatusHistoryTable.$inferInsert
): Promise<void> => {
    await executor.insert(rideStatusHistoryTable).values(values);
};

export const findOverlappingRidesForDriver = async (
    executor: Executor,
    driverId: string,
    startAt: Date,
    endAt: Date
) => {
    return await executor.query.rides.findMany({
        where: and(
            eq(ridesTable.driverId, driverId),
            rideNotSoftDeleted,
            inArray(ridesTable.rideStatus, ["PLANNED", "IN_PROGRESS"]),
            lt(ridesTable.departureAt, endAt),
            or(
                isNull(ridesTable.arrivalEstimateAt),
                gte(ridesTable.arrivalEstimateAt, startAt)
            )
        ),
    });
};
