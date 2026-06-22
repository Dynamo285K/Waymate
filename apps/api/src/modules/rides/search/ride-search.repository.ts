import {
    eq,
    and,
    isNull,
    isNotNull,
    asc,
    desc,
    gte,
    lte,
    lt,
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
import { rideRouteCells as rideRouteCellsTable } from "../../../db/schema/ride_route_cell";
import * as h3 from "h3-js";
import { dayBoundsInTimeZone } from "../../../shared/time";
import {
    rideNotSoftDeleted,
    bookingNotSoftDeleted,
    driverNotBlockedForViewer,
} from "../ride.repository.shared";
import type { RideSearchResultItem } from "../ride.types";

export const searchRides = async (
    executor: Executor,
    startLat: number,
    startLng: number,
    destLat: number,
    destLng: number,
    travelDate: Date | undefined,
    startCity: string,
    destCity: string,
    viewerId?: string
): Promise<RideSearchResultItem[]> => {
    const startCell = h3.latLngToCell(startLat, startLng, 7);
    const destCell = h3.latLngToCell(destLat, destLng, 7);
    const startH3s = h3.gridDisk(startCell, 12); // Approx. 20 km radius
    const destH3s = h3.gridDisk(destCell, 12);
    const { start: startOfDay, end: endOfDay } = travelDate
        ? dayBoundsInTimeZone(travelDate)
        : { start: new Date(), end: undefined };

    const pickupCells = aliasedTable(rideRouteCellsTable, "pickup_cells");
    const dropoffCells = aliasedTable(rideRouteCellsTable, "dropoff_cells");

    const pickupDistanceSql = sql<number>`(
        6371 * acos(
            least(1.0, cos(radians(${startLat})) * cos(radians(${pickupCells.lat})) * cos(radians(${pickupCells.lng}) - radians(${startLng})) +
            sin(radians(${startLat})) * sin(radians(${pickupCells.lat})))
        )
    )::numeric`;

    const dropoffDistanceSql = sql<number>`(
        6371 * acos(
            least(1.0, cos(radians(${destLat})) * cos(radians(${dropoffCells.lat})) * cos(radians(${dropoffCells.lng}) - radians(${destLng})) +
            sin(radians(${destLat})) * sin(radians(${dropoffCells.lat})))
        )
    )::numeric`;

    const maxDistanceSql = sql<number>`GREATEST(${pickupDistanceSql}, ${dropoffDistanceSql})`;
    const distanceZoneSql = sql<number>`
        CASE
            WHEN ${maxDistanceSql} <= 5 THEN 1
            WHEN ${maxDistanceSql} <= 15 THEN 2
            WHEN ${maxDistanceSql} <= 30 THEN 3
            ELSE 4
        END
    `;

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
                    "CONFIRMED",
                    "COMPLETED",
                ]),
                bookingNotSoftDeleted
            )
        )
        .groupBy(bookingsTable.rideId)
        .as("search_capacity_by_ride");

    const maxPriceByRide = executor
        .select({
            rideId: pricesTable.rideId,
            totalPrice: sql<number>`MAX(${pricesTable.amount})::float`.as(
                "totalPrice"
            ),
        })
        .from(pricesTable)
        .groupBy(pricesTable.rideId)
        .as("max_price_by_ride");

    const maxPointsByRide = executor
        .select({
            rideId: rideRouteCellsTable.rideId,
            totalPoints:
                sql<number>`MAX(${rideRouteCellsTable.pointOrder})::float`.as(
                    "totalPoints"
                ),
        })
        .from(rideRouteCellsTable)
        .groupBy(rideRouteCellsTable.rideId)
        .as("max_points_by_ride");

    const calculatedPriceAmount = sql<number>`GREATEST(
        1.0,
        ROUND(
            ((${maxPriceByRide.totalPrice} * (${dropoffCells.pointOrder} - ${pickupCells.pointOrder})) /
            GREATEST(1.0, ${maxPointsByRide.totalPoints}))::numeric,
        0)::float
    )`;

    const result = await executor
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
                pickupStopId: sql<string>`'dynamic'`,
                isDynamic: sql<boolean>`true`,
                lat: pickupCells.lat,
                lng: pickupCells.lng,
                city: sql<string>`${startCity}`,
                plannedDepartureAt: sql<Date>`COALESCE(
                    ${ridesTable.departureAt} +
                    (${ridesTable.arrivalEstimateAt} - ${ridesTable.departureAt}) *
                    (${pickupCells.pointOrder} / GREATEST(1.0, ${maxPointsByRide.totalPoints})::numeric),
                    ${ridesTable.departureAt}
                )`.mapWith(ridesTable.departureAt),
                distanceKm: sql<number>`ROUND(${pickupDistanceSql}, 1)::float`,
            },
            dropoffStop: {
                dropoffStopId: sql<string>`'dynamic'`,
                isDynamic: sql<boolean>`true`,
                lat: dropoffCells.lat,
                lng: dropoffCells.lng,
                city: sql<string>`${destCity}`,
                plannedArrivalAt: sql<Date>`COALESCE(
                    ${ridesTable.departureAt} +
                    (${ridesTable.arrivalEstimateAt} - ${ridesTable.departureAt}) *
                    (${dropoffCells.pointOrder} / GREATEST(1.0, ${maxPointsByRide.totalPoints})::numeric),
                    ${ridesTable.arrivalEstimateAt}
                )`.mapWith(ridesTable.departureAt),
                distanceKm: sql<number>`ROUND(${dropoffDistanceSql}, 1)::float`,
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
            priceAmount: calculatedPriceAmount,
        })
        .from(ridesTable)
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
        .leftJoin(driverRatings, eq(driverRatings.subjectId, usersTable.id))
        .innerJoin(
            pickupCells,
            and(
                eq(ridesTable.id, pickupCells.rideId),
                inArray(pickupCells.h3Res7, startH3s)
            )
        )
        .innerJoin(
            dropoffCells,
            and(
                eq(ridesTable.id, dropoffCells.rideId),
                inArray(dropoffCells.h3Res7, destH3s)
            )
        )
        .leftJoin(maxPriceByRide, eq(maxPriceByRide.rideId, ridesTable.id))
        .leftJoin(maxPointsByRide, eq(maxPointsByRide.rideId, ridesTable.id))
        .leftJoin(capacityByRide, eq(capacityByRide.rideId, ridesTable.id))
        .where(
            and(
                rideNotSoftDeleted,
                eq(ridesTable.rideStatus, "PLANNED"),
                isNotNull(usersTable.firstName),
                isNotNull(usersTable.lastName),
                lt(pickupCells.pointOrder, dropoffCells.pointOrder),
                gte(ridesTable.departureAt, startOfDay),
                endOfDay ? lt(ridesTable.departureAt, endOfDay) : undefined,
                lte(pickupDistanceSql, 15),
                lte(dropoffDistanceSql, 15),
                driverNotBlockedForViewer(viewerId)
            )
        )
        .orderBy(asc(distanceZoneSql), asc(ridesTable.departureAt));

    return result as RideSearchResultItem[];
};

export const findStopsForRides = async (
    executor: Executor,
    rideIds: string[]
): Promise<(typeof rideStopsTable.$inferSelect)[]> => {
    if (rideIds.length === 0) return [];
    return await executor
        .select()
        .from(rideStopsTable)
        .where(
            and(
                inArray(rideStopsTable.rideId, rideIds),
                eq(rideStopsTable.isDynamic, false)
            )
        );
};

export const findPricesForRides = async (
    executor: Executor,
    rideIds: string[]
): Promise<(typeof pricesTable.$inferSelect)[]> => {
    if (rideIds.length === 0) return [];
    return await executor
        .select()
        .from(pricesTable)
        .where(inArray(pricesTable.rideId, rideIds));
};
