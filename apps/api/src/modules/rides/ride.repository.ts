import {
    eq,
    and,
    isNull,
    isNotNull,
    asc,
    desc,
    gte,
    lt,
    inArray,
    ne,
    sql,
    aliasedTable,
} from "drizzle-orm";
import type { Executor } from "../../db";
import { rides as ridesTable } from "../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../db/schema/ride_stop";
import { prices as pricesTable } from "../../db/schema/price";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { users as usersTable } from "../../db/schema/user";
import { reviews as reviewsTable } from "../../db/schema/review";
import { rideStatusHistory as rideStatusHistoryTable } from "../../db/schema/ride_status_history";
import { bookingStatusHistory as bookingStatusHistoryTable } from "../../db/schema";
import { cars as carsTable } from "../../db/schema/car";
import { cities as citiesTable } from "../../db/schema/city";
import { dayBoundsInTimeZone } from "../../shared/time";
import type {
    RideListItem,
    RideTimeframe,
    RideSearchResultItem,
    AvailableRideItem,
    BookingStatus,
} from "./ride.types";

const rideNotSoftDeleted = isNull(ridesTable.deletedAt);
const bookingNotSoftDeleted = isNull(bookingsTable.deletedAt);
const carNotSoftDeleted = isNull(carsTable.deletedAt);

// Raw bundle returned by findRidePassengersBundle — the relational query
// result with no derived fields. Service composes this with reviews + status
// to project the public RidePassengersView.
export type RidePassengersBundle = {
    id: string;
    departureAt: Date;
    rideStatus: RideListItem["rideStatus"];
    offeredSeats: number;
    currency: string;
    rideStops: { id: string; city: string; stopOrder: number }[];
    bookings: {
        id: string;
        bookingStatus: BookingStatus;
        seatCount: number;
        passenger: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            profilePhotoUrl: string | null;
        };
        pickupStop: { id: string; city: string; stopOrder: number } | null;
        dropoffStop: { id: string; city: string; stopOrder: number } | null;
    }[];
};

const findRidesByDriverId = async (
    executor: Executor,
    driverId: string,
    timeframe: RideTimeframe = "UPCOMING"
): Promise<RideListItem[]> => {
    const now = new Date();

    const filters = [
        eq(ridesTable.driverId, driverId),
        rideNotSoftDeleted,
        ne(ridesTable.rideStatus, "CANCELLED"),
    ];

    if (timeframe === "UPCOMING") {
        filters.push(gte(ridesTable.departureAt, now));
    } else if (timeframe === "PAST") {
        filters.push(lt(ridesTable.departureAt, now));
    }

    const result = await executor.query.rides.findMany({
        where: and(...filters),
        with: {
            rideStops: {
                columns: { stopOrder: true },
                with: { city: { columns: { name: true } } },
                orderBy: [asc(rideStopsTable.stopOrder)],
            },
            bookings: {
                where: inArray(bookingsTable.bookingStatus, [
                    "CONFIRMED",
                    "COMPLETED",
                ]),
                columns: {
                    id: true,
                    seatCount: true,
                },
            },
            prices: {
                columns: {
                    amount: true,
                    currency: true,
                    startStopId: true,
                    endStopId: true,
                },
            },
        },
        orderBy: [
            timeframe === "UPCOMING"
                ? asc(ridesTable.departureAt)
                : desc(ridesTable.departureAt),
        ],
    });

    // Flatten the joined city object back into a plain `city` string so
    // the API response shape stays identical to the pre-FK contract.
    return result.map((r) => ({
        ...r,
        rideStops: r.rideStops.map((rs) => ({
            city: rs.city.name,
            stopOrder: rs.stopOrder,
        })),
    })) as RideListItem[];
};

const findRidePassengersBundle = async (
    executor: Executor,
    rideId: string,
    driverId: string
): Promise<RidePassengersBundle | null> => {
    const result = await executor.query.rides.findFirst({
        where: and(
            eq(ridesTable.id, rideId),
            eq(ridesTable.driverId, driverId),
            rideNotSoftDeleted
        ),
        columns: {
            id: true,
            departureAt: true,
            rideStatus: true,
            offeredSeats: true,
            currency: true,
        },
        with: {
            rideStops: {
                columns: { id: true, stopOrder: true },
                with: { city: { columns: { name: true } } },
                orderBy: [asc(rideStopsTable.stopOrder)],
            },
            bookings: {
                where: inArray(bookingsTable.bookingStatus, [
                    "CONFIRMED",
                    "COMPLETED",
                ]),
                columns: {
                    id: true,
                    bookingStatus: true,
                    seatCount: true,
                },
                with: {
                    passenger: {
                        columns: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profilePhotoUrl: true,
                        },
                    },
                    pickupStop: {
                        columns: { id: true, stopOrder: true },
                        with: { city: { columns: { name: true } } },
                    },
                    dropoffStop: {
                        columns: { id: true, stopOrder: true },
                        with: { city: { columns: { name: true } } },
                    },
                },
            },
        },
    });

    if (!result) return null;

    // Flatten joined city objects back to `city: string` so callers see
    // the same shape they did before the cityId FK was introduced.
    return {
        ...result,
        rideStops: result.rideStops.map((rs) => ({
            id: rs.id,
            city: rs.city.name,
            stopOrder: rs.stopOrder,
        })),
        bookings: result.bookings.map((b) => ({
            ...b,
            pickupStop: b.pickupStop
                ? {
                      id: b.pickupStop.id,
                      city: b.pickupStop.city.name,
                      stopOrder: b.pickupStop.stopOrder,
                  }
                : null,
            dropoffStop: b.dropoffStop
                ? {
                      id: b.dropoffStop.id,
                      city: b.dropoffStop.city.name,
                      stopOrder: b.dropoffStop.stopOrder,
                  }
                : null,
        })),
    };
};

const findReviewsByAuthorForSubjects = async (
    executor: Executor,
    rideId: string,
    authorId: string,
    subjectIds: string[]
): Promise<{ id: string; subjectId: string; rating: number }[]> => {
    if (subjectIds.length === 0) return [];

    return await executor
        .select({
            id: reviewsTable.id,
            subjectId: reviewsTable.subjectId,
            rating: reviewsTable.rating,
        })
        .from(reviewsTable)
        .where(
            and(
                eq(reviewsTable.rideId, rideId),
                eq(reviewsTable.authorId, authorId),
                inArray(reviewsTable.subjectId, subjectIds),
                eq(reviewsTable.reviewStatus, "VISIBLE")
            )
        );
};

const pickupStops = aliasedTable(rideStopsTable, "pickup_stops");
const dropoffStops = aliasedTable(rideStopsTable, "dropoff_stops");
const pickupCities = aliasedTable(citiesTable, "pickup_cities");
const dropoffCities = aliasedTable(citiesTable, "dropoff_cities");

const findAvailableRides = async (
    executor: Executor
): Promise<AvailableRideItem[]> => {
    const now = new Date();

    const capacityByRide = executor
        .select({
            rideId: bookingsTable.rideId,
            occupiedSeats:
                sql<number>`COALESCE(SUM(${bookingsTable.seatCount}), 0)::int`.as(
                    "occupiedSeats"
                ),
        })
        .from(bookingsTable)
        .where(
            and(
                inArray(bookingsTable.bookingStatus, [
                    "PENDING",
                    "CONFIRMED",
                    "COMPLETED",
                ]),
                bookingNotSoftDeleted
            )
        )
        .groupBy(bookingsTable.rideId)
        .as("capacity_by_available_ride");

    const driverRatings = executor
        .select({
            subjectId: reviewsTable.subjectId,
            averageRating: sql<number>`AVG(${reviewsTable.rating})::float`.as(
                "averageRating"
            ),
            reviewCount: sql<number>`COUNT(${reviewsTable.id})::int`.as(
                "reviewCount"
            ),
        })
        .from(reviewsTable)
        .where(
            and(
                eq(reviewsTable.reviewStatus, "VISIBLE"),
                isNull(reviewsTable.deletedAt)
            )
        )
        .groupBy(reviewsTable.subjectId)
        .as("available_driver_ratings");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("available_last_stop_orders");

    const rows = await executor
        .select({
            rideId: ridesTable.id,
            departureAt: ridesTable.departureAt,
            rideStatus: ridesTable.rideStatus,
            offeredSeats: ridesTable.offeredSeats,
            seatsLeft: sql<number>`GREATEST(0, ${ridesTable.offeredSeats} - COALESCE(${capacityByRide.occupiedSeats}, 0))::int`,
            currency: ridesTable.currency,
            driver: {
                id: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                profilePhotoUrl: usersTable.profilePhotoUrl,
                averageRating: driverRatings.averageRating,
                reviewCount: sql<number>`COALESCE(${driverRatings.reviewCount}, 0)::int`,
            },
            pickupStop: {
                pickupStopId: pickupStops.id,
                city: pickupCities.name,
                plannedDepartureAt: pickupStops.plannedDepartureAt,
            },
            dropoffStop: {
                dropoffStopId: dropoffStops.id,
                city: dropoffCities.name,
                plannedArrivalAt: dropoffStops.plannedArrivalAt,
            },
            priceAmount: pricesTable.amount,
        })
        .from(ridesTable)
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
        .leftJoin(driverRatings, eq(driverRatings.subjectId, usersTable.id))
        .leftJoin(capacityByRide, eq(capacityByRide.rideId, ridesTable.id))
        .innerJoin(
            pickupStops,
            and(
                eq(pickupStops.rideId, ridesTable.id),
                eq(pickupStops.stopOrder, 0)
            )
        )
        .innerJoin(pickupCities, eq(pickupCities.id, pickupStops.cityId))
        .innerJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .innerJoin(
            dropoffStops,
            and(
                eq(dropoffStops.rideId, ridesTable.id),
                eq(dropoffStops.stopOrder, lastStopOrders.stopOrder)
            )
        )
        .innerJoin(dropoffCities, eq(dropoffCities.id, dropoffStops.cityId))
        .leftJoin(
            pricesTable,
            and(
                eq(pricesTable.rideId, ridesTable.id),
                eq(pricesTable.startStopId, pickupStops.id),
                eq(pricesTable.endStopId, dropoffStops.id)
            )
        )
        .where(
            and(
                rideNotSoftDeleted,
                eq(ridesTable.rideStatus, "PLANNED"),
                gte(ridesTable.departureAt, now),
                sql`GREATEST(0, ${ridesTable.offeredSeats} - COALESCE(${capacityByRide.occupiedSeats}, 0)) > 0`
            )
        )
        .orderBy(asc(ridesTable.departureAt));

    return rows as AvailableRideItem[];
};

const searchRides = async (
    executor: Executor,
    startCityId: string,
    destinationCityId: string,
    travelDate: Date
): Promise<RideSearchResultItem[]> => {
    // Bound the day in the business time zone, not the server's local time —
    // on a UTC host setHours(0..) would shift the window 1–2h off the user's
    // calendar day and drop early/late rides. See shared/time.ts.
    const { start: startOfDay, end: endOfDay } =
        dayBoundsInTimeZone(travelDate);

    const driverRatings = executor
        .select({
            subjectId: reviewsTable.subjectId,
            averageRating: sql<number>`AVG(${reviewsTable.rating})::float`.as(
                "averageRating"
            ),
            reviewCount: sql<number>`COUNT(${reviewsTable.id})::int`.as(
                "reviewCount"
            ),
        })
        .from(reviewsTable)
        .where(
            and(
                eq(reviewsTable.reviewStatus, "VISIBLE"),
                isNull(reviewsTable.deletedAt)
            )
        )
        .groupBy(reviewsTable.subjectId)
        .as("driver_ratings");

    const capacityByRide = executor
        .select({
            rideId: bookingsTable.rideId,
            occupiedSeats:
                sql<number>`COALESCE(SUM(${bookingsTable.seatCount}), 0)::int`.as(
                    "occupiedSeats"
                ),
        })
        .from(bookingsTable)
        .where(
            and(
                inArray(bookingsTable.bookingStatus, [
                    "PENDING",
                    "CONFIRMED",
                    "COMPLETED",
                ]),
                bookingNotSoftDeleted
            )
        )
        .groupBy(bookingsTable.rideId)
        .as("search_capacity_by_ride");

    const result = await executor
        .select({
            rideId: ridesTable.id,
            departureAt: ridesTable.departureAt,
            rideStatus: ridesTable.rideStatus,
            offeredSeats: ridesTable.offeredSeats,
            seatsLeft: sql<number>`GREATEST(0, ${ridesTable.offeredSeats} - COALESCE(${capacityByRide.occupiedSeats}, 0))::int`,
            currency: ridesTable.currency,
            driver: {
                id: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                profilePhotoUrl: usersTable.profilePhotoUrl,
                averageRating: driverRatings.averageRating,
                reviewCount: sql<number>`COALESCE(${driverRatings.reviewCount}, 0)::int`,
            },
            pickupStop: {
                pickupStopId: pickupStops.id,
                city: pickupCities.name,
                plannedDepartureAt: pickupStops.plannedDepartureAt,
            },
            dropoffStop: {
                dropoffStopId: dropoffStops.id,
                city: dropoffCities.name,
                plannedArrivalAt: dropoffStops.plannedArrivalAt,
            },
            priceAmount: pricesTable.amount,
        })
        .from(ridesTable)
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
        .leftJoin(driverRatings, eq(driverRatings.subjectId, usersTable.id))
        .innerJoin(
            pickupStops,
            and(
                eq(ridesTable.id, pickupStops.rideId),
                eq(pickupStops.cityId, startCityId)
            )
        )
        .innerJoin(pickupCities, eq(pickupCities.id, pickupStops.cityId))
        .innerJoin(
            dropoffStops,
            and(
                eq(ridesTable.id, dropoffStops.rideId),
                eq(dropoffStops.cityId, destinationCityId)
            )
        )
        .innerJoin(dropoffCities, eq(dropoffCities.id, dropoffStops.cityId))
        .leftJoin(
            pricesTable,
            and(
                eq(pricesTable.rideId, ridesTable.id),
                eq(pricesTable.startStopId, pickupStops.id),
                eq(pricesTable.endStopId, dropoffStops.id)
            )
        )
        .leftJoin(capacityByRide, eq(capacityByRide.rideId, ridesTable.id))
        .where(
            and(
                rideNotSoftDeleted,
                eq(ridesTable.rideStatus, "PLANNED"),
                isNotNull(usersTable.firstName),
                isNotNull(usersTable.lastName),
                lt(pickupStops.stopOrder, dropoffStops.stopOrder),
                gte(ridesTable.departureAt, startOfDay),
                lt(ridesTable.departureAt, endOfDay)
            )
        )
        .orderBy(asc(ridesTable.departureAt));

    return result as RideSearchResultItem[];
};

const findActiveCarForDriver = async (
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

const insertRide = async (
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

const insertRideStops = async (
    executor: Executor,
    values: (typeof rideStopsTable.$inferInsert)[]
) => {
    return await executor.insert(rideStopsTable).values(values).returning({
        id: rideStopsTable.id,
        stopOrder: rideStopsTable.stopOrder,
    });
};

const insertRidePrices = async (
    executor: Executor,
    values: (typeof pricesTable.$inferInsert)[]
): Promise<void> => {
    await executor.insert(pricesTable).values(values);
};

const insertRideStatusHistory = async (
    executor: Executor,
    values: typeof rideStatusHistoryTable.$inferInsert
): Promise<void> => {
    await executor.insert(rideStatusHistoryTable).values(values);
};

const findRideForCancel = async (
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

const updateRideStatusToCancelled = async (
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

const findActiveBookingsByRideId = async (
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

const findRideForComplete = async (
    executor: Executor,
    rideId: string,
    driverId: string
): Promise<{
    rideStatus: RideListItem["rideStatus"];
    departureAt: Date;
} | null> => {
    const ride = await executor.query.rides.findFirst({
        where: and(
            eq(ridesTable.id, rideId),
            eq(ridesTable.driverId, driverId),
            rideNotSoftDeleted
        ),
        columns: { rideStatus: true, departureAt: true },
    });

    return ride ?? null;
};

const updateRideStatusToCompleted = async (
    executor: Executor,
    rideId: string,
    driverId: string
): Promise<{ id: string } | null> => {
    const [updatedRide] = await executor
        .update(ridesTable)
        .set({ rideStatus: "COMPLETED" })
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

const findConfirmedBookingsByRideId = async (
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

const bulkCompleteBookings = async (
    executor: Executor,
    bookingIds: string[]
): Promise<void> => {
    await executor
        .update(bookingsTable)
        .set({ bookingStatus: "COMPLETED" })
        .where(inArray(bookingsTable.id, bookingIds));
};

const bulkCancelBookings = async (
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

const bulkInsertBookingStatusHistory = async (
    executor: Executor,
    values: (typeof bookingStatusHistoryTable.$inferInsert)[]
): Promise<void> => {
    await executor.insert(bookingStatusHistoryTable).values(values);
};

export const RideRepository = {
    findRidesByDriverId,
    findRidePassengersBundle,
    findReviewsByAuthorForSubjects,
    findAvailableRides,
    searchRides,
    findActiveCarForDriver,
    insertRide,
    insertRideStops,
    insertRidePrices,
    insertRideStatusHistory,
    findRideForCancel,
    updateRideStatusToCancelled,
    findActiveBookingsByRideId,
    findRideForComplete,
    updateRideStatusToCompleted,
    findConfirmedBookingsByRideId,
    bulkCompleteBookings,
    bulkCancelBookings,
    bulkInsertBookingStatusHistory,
};
