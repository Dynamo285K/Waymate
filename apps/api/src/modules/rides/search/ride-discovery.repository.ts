import {
    eq,
    and,
    isNull,
    asc,
    desc,
    gte,
    inArray,
    sql,
    aliasedTable,
} from "drizzle-orm";
import type { Executor } from "../../../db";
import { rides as ridesTable } from "../../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../../db/schema/ride_stop";
import { prices as pricesTable } from "../../../db/schema/price";
import { bookings as bookingsTable } from "../../../db/schema/booking";
import { users as usersTable } from "../../../db/schema/user";
import { reviews as reviewsTable } from "../../../db/schema/review";
import {
    rideNotSoftDeleted,
    bookingNotSoftDeleted,
    driverNotBlockedForViewer,
} from "../ride.repository.shared";
import type { AvailableRideItem, PopularRoute } from "../ride.types";

const pickupStops = aliasedTable(rideStopsTable, "pickup_stops");
const dropoffStops = aliasedTable(rideStopsTable, "dropoff_stops");

export const findAvailableRides = async (
    executor: Executor,
    viewerId?: string
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
        .where(eq(rideStopsTable.isDynamic, false))
        .groupBy(rideStopsTable.rideId)
        .as("available_last_stop_orders");

    const rows = await executor
        .select({
            rideId: ridesTable.id,
            departureAt: ridesTable.departureAt,
            arrivalEstimateAt: ridesTable.arrivalEstimateAt,
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
                city: pickupStops.city,
                plannedDepartureAt: pickupStops.plannedDepartureAt,
            },
            dropoffStop: {
                dropoffStopId: dropoffStops.id,
                city: dropoffStops.city,
                plannedArrivalAt: dropoffStops.plannedArrivalAt,
            },
            originalStartCity: sql<string>`(${executor
                .select({ city: rideStopsTable.city })
                .from(rideStopsTable)
                .where(
                    and(
                        eq(rideStopsTable.rideId, ridesTable.id),
                        eq(rideStopsTable.isDynamic, false)
                    )
                )
                .orderBy(asc(rideStopsTable.stopOrder))
                .limit(1)})`,
            originalEndCity: sql<string>`(${executor
                .select({ city: rideStopsTable.city })
                .from(rideStopsTable)
                .where(
                    and(
                        eq(rideStopsTable.rideId, ridesTable.id),
                        eq(rideStopsTable.isDynamic, false)
                    )
                )
                .orderBy(desc(rideStopsTable.stopOrder))
                .limit(1)})`,
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
        .innerJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .innerJoin(
            dropoffStops,
            and(
                eq(dropoffStops.rideId, ridesTable.id),
                eq(dropoffStops.stopOrder, lastStopOrders.stopOrder)
            )
        )
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
                sql`GREATEST(0, ${ridesTable.offeredSeats} - COALESCE(${capacityByRide.occupiedSeats}, 0)) > 0`,
                driverNotBlockedForViewer(viewerId)
            )
        )
        .orderBy(asc(ridesTable.departureAt));

    return rows as AvailableRideItem[];
};

// Top origin → destination pairs by ride count, used for the home page
// "popular routes" chips. Counts the advertised (non-dynamic) endpoints of
// every non-deleted ride, mirroring the admin dashboard's definition.
export const findPopularRoutes = async (
    executor: Executor,
    limit: number
): Promise<PopularRoute[]> => {
    const originStops = aliasedTable(rideStopsTable, "popular_origin_stops");
    const destStops = aliasedTable(rideStopsTable, "popular_dest_stops");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .where(eq(rideStopsTable.isDynamic, false))
        .groupBy(rideStopsTable.rideId)
        .as("popular_last_stop_orders");

    const rows = await executor
        .select({
            originCity: originStops.city,
            originLat: sql<number>`AVG(${originStops.lat})::float`,
            originLng: sql<number>`AVG(${originStops.lng})::float`,
            destinationCity: destStops.city,
            destLat: sql<number>`AVG(${destStops.lat})::float`,
            destLng: sql<number>`AVG(${destStops.lng})::float`,
            count: sql<number>`COUNT(${ridesTable.id})::int`,
        })
        .from(ridesTable)
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
        .where(
            and(
                rideNotSoftDeleted,
                eq(ridesTable.rideStatus, "PLANNED"),
                gte(ridesTable.departureAt, new Date())
            )
        )
        .groupBy(originStops.city, destStops.city)
        .orderBy(desc(sql`COUNT(${ridesTable.id})`))
        .limit(limit);

    return rows;
};
