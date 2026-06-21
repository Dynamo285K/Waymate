import {
    aliasedTable,
    and,
    asc,
    desc,
    eq,
    ilike,
    inArray,
    isNull,
    lt,
    ne,
    or,
    sql,
} from "drizzle-orm";
import type {
    AdminRideDetail,
    AdminRideListItem,
    AdminRideStatusHistoryItem,
    RideStatus,
} from "@repo/shared";
import type { Executor } from "../../../db";
import { users as usersTable } from "../../../db/schema/user";
import { rides as ridesTable } from "../../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../../db/schema/ride_stop";
import { prices as pricesTable } from "../../../db/schema/price";
import { bookings as bookingsTable } from "../../../db/schema/booking";
import { cars as carsTable } from "../../../db/schema/car";
import { carModels as carModelsTable } from "../../../db/schema/car_model";
import { rideStatusHistory as rideStatusHistoryTable } from "../../../db/schema/ride_status_history";

const visibleRideJoinConditions = [
    isNull(ridesTable.deletedAt),
    isNull(usersTable.deletedAt),
    ne(usersTable.userRole, "ADMIN"),
];

const findRideList = async (
    executor: Executor,
    params: {
        limit: number;
        status?: RideStatus;
        search?: string;
        cursorPosition?: { id: string; createdAt: Date };
    }
): Promise<AdminRideListItem[]> => {
    const conditions = [...visibleRideJoinConditions];

    if (params.status) {
        conditions.push(eq(ridesTable.rideStatus, params.status));
    }

    if (params.search) {
        const pattern = `%${params.search}%`;
        const searchClause = or(
            ilike(usersTable.email, pattern),
            ilike(usersTable.firstName, pattern),
            ilike(usersTable.lastName, pattern)
        );
        if (searchClause) conditions.push(searchClause);
    }

    if (params.cursorPosition) {
        const cursorClause = or(
            lt(ridesTable.createdAt, params.cursorPosition.createdAt),
            and(
                eq(ridesTable.createdAt, params.cursorPosition.createdAt),
                lt(ridesTable.id, params.cursorPosition.id)
            )
        );
        if (cursorClause) conditions.push(cursorClause);
    }

    const originStops = aliasedTable(rideStopsTable, "admin_origin_stops");
    const destStops = aliasedTable(rideStopsTable, "admin_dest_stops");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("admin_ride_last_stops");

    const seatsByRide = executor
        .select({
            rideId: bookingsTable.rideId,
            seats: sql<number>`COALESCE(SUM(${bookingsTable.seatCount}), 0)::int`.as(
                "seats"
            ),
        })
        .from(bookingsTable)
        .where(
            and(
                inArray(bookingsTable.bookingStatus, ["PENDING", "CONFIRMED"]),
                isNull(bookingsTable.deletedAt)
            )
        )
        .groupBy(bookingsTable.rideId)
        .as("admin_ride_active_seats");

    const rows = await executor
        .select({
            id: ridesTable.id,
            rideStatus: ridesTable.rideStatus,
            departureAt: ridesTable.departureAt,
            offeredSeats: ridesTable.offeredSeats,
            currency: ridesTable.currency,
            createdAt: ridesTable.createdAt,
            originCity: originStops.city,
            destinationCity: destStops.city,
            activeSeatCount: sql<number>`COALESCE(${seatsByRide.seats}, 0)::int`,
            driverId: usersTable.id,
            driverEmail: usersTable.email,
            driverFirstName: usersTable.firstName,
            driverLastName: usersTable.lastName,
            driverProfilePhotoUrl: usersTable.profilePhotoUrl,
        })
        .from(ridesTable)
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
        .innerJoin(
            originStops,
            and(
                eq(originStops.rideId, ridesTable.id),
                eq(originStops.stopOrder, 0)
            )
        )
        .innerJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .innerJoin(
            destStops,
            and(
                eq(destStops.rideId, ridesTable.id),
                eq(destStops.stopOrder, lastStopOrders.stopOrder)
            )
        )
        .leftJoin(seatsByRide, eq(seatsByRide.rideId, ridesTable.id))
        .where(and(...conditions))
        .orderBy(desc(ridesTable.createdAt), desc(ridesTable.id))
        .limit(params.limit);

    return rows.map((row) => ({
        id: row.id,
        rideStatus: row.rideStatus,
        departureAt: row.departureAt,
        offeredSeats: row.offeredSeats,
        currency: row.currency,
        originCity: row.originCity,
        destinationCity: row.destinationCity,
        activeSeatCount: row.activeSeatCount,
        driver: {
            id: row.driverId,
            email: row.driverEmail,
            firstName: row.driverFirstName,
            lastName: row.driverLastName,
            profilePhotoUrl: row.driverProfilePhotoUrl,
        },
        createdAt: row.createdAt,
    }));
};

const findRideCreatedAt = async (
    executor: Executor,
    id: string
): Promise<Date | null> => {
    const [row] = await executor
        .select({ createdAt: ridesTable.createdAt })
        .from(ridesTable)
        .where(eq(ridesTable.id, id))
        .limit(1);

    return row?.createdAt ?? null;
};

const findRideDetailById = async (
    executor: Executor,
    id: string
): Promise<AdminRideDetail | null> => {
    const [row] = await executor
        .select({
            id: ridesTable.id,
            rideStatus: ridesTable.rideStatus,
            departureAt: ridesTable.departureAt,
            arrivalEstimateAt: ridesTable.arrivalEstimateAt,
            autoEndAt: ridesTable.autoEndAt,
            endedAt: ridesTable.endedAt,
            endedByUserId: ridesTable.endedByUserId,
            endSource: ridesTable.endSource,
            endReason: ridesTable.endReason,
            autoEndProcessedAt: ridesTable.autoEndProcessedAt,
            offeredSeats: ridesTable.offeredSeats,
            currency: ridesTable.currency,
            description: ridesTable.description,
            createdAt: ridesTable.createdAt,
            updatedAt: ridesTable.updatedAt,
            driverId: usersTable.id,
            driverEmail: usersTable.email,
            driverFirstName: usersTable.firstName,
            driverLastName: usersTable.lastName,
            driverProfilePhotoUrl: usersTable.profilePhotoUrl,
            driverUserStatus: usersTable.userStatus,
            carId: carsTable.id,
            carSpz: carsTable.spz,
            carBrand: carModelsTable.brand,
            carModelName: carModelsTable.modelName,
        })
        .from(ridesTable)
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
        .innerJoin(carsTable, eq(ridesTable.carId, carsTable.id))
        .leftJoin(carModelsTable, eq(carsTable.modelId, carModelsTable.id))
        .where(and(eq(ridesTable.id, id), ...visibleRideJoinConditions))
        .limit(1);

    if (!row) return null;

    const [stops, prices, rideBookings] = await Promise.all([
        executor
            .select({
                id: rideStopsTable.id,
                stopOrder: rideStopsTable.stopOrder,
                address: rideStopsTable.address,
                city: rideStopsTable.city,
                countryCode: rideStopsTable.countryCode,
                plannedArrivalAt: rideStopsTable.plannedArrivalAt,
                plannedDepartureAt: rideStopsTable.plannedDepartureAt,
            })
            .from(rideStopsTable)
            .where(eq(rideStopsTable.rideId, id))
            .orderBy(asc(rideStopsTable.stopOrder)),
        executor
            .select({
                startStopId: pricesTable.startStopId,
                endStopId: pricesTable.endStopId,
                amount: pricesTable.amount,
                currency: pricesTable.currency,
            })
            .from(pricesTable)
            .where(eq(pricesTable.rideId, id)),
        executor
            .select({
                id: bookingsTable.id,
                bookingStatus: bookingsTable.bookingStatus,
                seatCount: bookingsTable.seatCount,
                passengerId: usersTable.id,
                passengerFirstName: usersTable.firstName,
                passengerLastName: usersTable.lastName,
                passengerProfilePhotoUrl: usersTable.profilePhotoUrl,
            })
            .from(bookingsTable)
            .innerJoin(usersTable, eq(bookingsTable.passengerId, usersTable.id))
            .where(
                and(
                    eq(bookingsTable.rideId, id),
                    isNull(bookingsTable.deletedAt)
                )
            ),
    ]);

    return {
        id: row.id,
        rideStatus: row.rideStatus,
        departureAt: row.departureAt,
        arrivalEstimateAt: row.arrivalEstimateAt,
        autoEndAt: row.autoEndAt,
        endedAt: row.endedAt,
        endedByUserId: row.endedByUserId,
        endSource: row.endSource,
        endReason: row.endReason,
        autoEndProcessedAt: row.autoEndProcessedAt,
        offeredSeats: row.offeredSeats,
        currency: row.currency,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        driver: {
            id: row.driverId,
            email: row.driverEmail,
            firstName: row.driverFirstName,
            lastName: row.driverLastName,
            profilePhotoUrl: row.driverProfilePhotoUrl,
            userStatus: row.driverUserStatus,
        },
        car: {
            id: row.carId,
            spz: row.carSpz,
            brand: row.carBrand,
            modelName: row.carModelName,
        },
        stops,
        prices,
        bookings: rideBookings.map((b) => ({
            id: b.id,
            bookingStatus: b.bookingStatus,
            seatCount: b.seatCount,
            passenger: {
                id: b.passengerId,
                firstName: b.passengerFirstName,
                lastName: b.passengerLastName,
                profilePhotoUrl: b.passengerProfilePhotoUrl,
            },
        })),
    };
};

const findRideStatusHistoryByRideId = async (
    executor: Executor,
    rideId: string,
    limit: number
): Promise<AdminRideStatusHistoryItem[]> => {
    const actor = aliasedTable(usersTable, "ride_history_actor");

    const rows = await executor
        .select({
            id: rideStatusHistoryTable.id,
            oldStatus: rideStatusHistoryTable.oldStatus,
            newStatus: rideStatusHistoryTable.newStatus,
            reason: rideStatusHistoryTable.reason,
            createdAt: rideStatusHistoryTable.createdAt,
            actorId: actor.id,
            actorFirstName: actor.firstName,
            actorLastName: actor.lastName,
        })
        .from(rideStatusHistoryTable)
        .leftJoin(actor, eq(rideStatusHistoryTable.changedByUserId, actor.id))
        .where(eq(rideStatusHistoryTable.rideId, rideId))
        .orderBy(desc(rideStatusHistoryTable.createdAt))
        .limit(limit);

    return rows.map((row) => ({
        id: row.id,
        oldStatus: row.oldStatus,
        newStatus: row.newStatus,
        reason: row.reason,
        createdAt: row.createdAt,
        changedBy: row.actorId
            ? {
                  id: row.actorId,
                  firstName: row.actorFirstName,
                  lastName: row.actorLastName,
              }
            : null,
    }));
};

const findRideForAdminCancel = async (
    executor: Executor,
    id: string
): Promise<{ rideStatus: RideStatus } | null> => {
    const [row] = await executor
        .select({ rideStatus: ridesTable.rideStatus })
        .from(ridesTable)
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
        .where(and(eq(ridesTable.id, id), ...visibleRideJoinConditions))
        .limit(1);

    return row ?? null;
};

const updateRideStatusToCancelledById = async (
    executor: Executor,
    id: string
): Promise<{ id: string } | null> => {
    const [updated] = await executor
        .update(ridesTable)
        .set({ rideStatus: "CANCELLED" })
        .where(and(eq(ridesTable.id, id), isNull(ridesTable.deletedAt)))
        .returning({ id: ridesTable.id });

    return updated ?? null;
};

const insertRideStatusHistoryRow = async (
    executor: Executor,
    values: {
        rideId: string;
        oldStatus: RideStatus | null;
        newStatus: RideStatus;
        changedByUserId: string;
        reason: string;
    }
): Promise<void> => {
    await executor.insert(rideStatusHistoryTable).values(values);
};

export const AdminRideRepository = {
    findRideList,
    findRideCreatedAt,
    findRideDetailById,
    findRideStatusHistoryByRideId,
    findRideForAdminCancel,
    updateRideStatusToCancelledById,
    insertRideStatusHistoryRow,
};
