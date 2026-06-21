import {
    eq,
    and,
    or,
    isNull,
    isNotNull,
    asc,
    desc,
    gte,
    lte,
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
import { rideRouteCells as rideRouteCellsTable } from "../../db/schema/ride_route_cell";
import { rideStatusHistory as rideStatusHistoryTable } from "../../db/schema/ride_status_history";
import { bookingStatusHistory as bookingStatusHistoryTable } from "../../db/schema";
import { cars as carsTable } from "../../db/schema/car";
import { blocklist as blocklistTable } from "../../db/schema/blocklist";
import * as h3 from "h3-js";
import { dayBoundsInTimeZone } from "../../shared/time";
import type {
    RideListItem,
    RideTimeframe,
    RideSearchResultItem,
    AvailableRideItem,
    BookingStatus,
    RideStatus,
    PopularRoute,
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
        priceAmount: number;
        currency: string;
        requestedPickupCity: string | null;
        requestedDropoffCity: string | null;
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
    const filters = [
        eq(ridesTable.driverId, driverId),
        rideNotSoftDeleted,
        ne(ridesTable.rideStatus, "CANCELLED"),
    ];

    if (timeframe === "UPCOMING") {
        filters.push(ne(ridesTable.rideStatus, "COMPLETED"));
    } else if (timeframe === "PAST") {
        filters.push(eq(ridesTable.rideStatus, "COMPLETED"));
    }

    const result = await executor.query.rides.findMany({
        where: and(...filters),
        with: {
            rideStops: {
                columns: { stopOrder: true, city: true },
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

    return result as RideListItem[];
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
                columns: { id: true, stopOrder: true, city: true },
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
                    priceAmount: true,
                    currency: true,
                    requestedPickupCity: true,
                    requestedDropoffCity: true,
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
                        columns: { id: true, stopOrder: true, city: true },
                    },
                    dropoffStop: {
                        columns: { id: true, stopOrder: true, city: true },
                    },
                },
            },
        },
    });

    if (!result) return null;

    return result as unknown as RidePassengersBundle;
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

const findAverageRatingsByUserIds = async (
    executor: Executor,
    userIds: string[]
): Promise<{ subjectId: string; averageRating: number | null }[]> => {
    if (userIds.length === 0) return [];

    return await executor
        .select({
            subjectId: reviewsTable.subjectId,
            averageRating: sql<
                number | null
            >`AVG(${reviewsTable.rating})::float`.as("averageRating"),
        })
        .from(reviewsTable)
        .where(
            and(
                inArray(reviewsTable.subjectId, userIds),
                eq(reviewsTable.reviewStatus, "VISIBLE"),
                isNull(reviewsTable.deletedAt)
            )
        )
        .groupBy(reviewsTable.subjectId);
};

const pickupStops = aliasedTable(rideStopsTable, "pickup_stops");
const dropoffStops = aliasedTable(rideStopsTable, "dropoff_stops");

// SQL fragment that excludes rides whose driver is in an active block (either
// direction) with the viewer. Returns undefined for anonymous searches (no
// viewer), and `and(...)` simply skips undefined conditions.
const driverNotBlockedForViewer = (viewerId: string | undefined) =>
    viewerId
        ? sql`NOT EXISTS (
            SELECT 1 FROM ${blocklistTable} bl
            WHERE bl.block_status = 'ACTIVE'
              AND bl.revoked_at IS NULL
              AND bl.deleted_at IS NULL
              AND (
                (bl.blocker_user_id = ${viewerId} AND bl.blocked_user_id = ${ridesTable.driverId})
                OR (bl.blocked_user_id = ${viewerId} AND bl.blocker_user_id = ${ridesTable.driverId})
              )
          )`
        : undefined;

const findAvailableRides = async (
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
const findPopularRoutes = async (
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
            destinationCity: destStops.city,
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
        .where(rideNotSoftDeleted)
        .groupBy(originStops.city, destStops.city)
        .orderBy(desc(sql`COUNT(${ridesTable.id})`))
        .limit(limit);

    return rows;
};

const searchRides = async (
    executor: Executor,
    startLat: number,
    startLng: number,
    destLat: number,
    destLng: number,
    travelDate: Date,
    startCity: string,
    destCity: string,
    viewerId?: string
): Promise<RideSearchResultItem[]> => {
    const startCell = h3.latLngToCell(startLat, startLng, 7);
    const destCell = h3.latLngToCell(destLat, destLng, 7);
    const startH3s = h3.gridDisk(startCell, 12); // Approx. 20 km radius
    const destH3s = h3.gridDisk(destCell, 12);
    const { start: startOfDay, end: endOfDay } =
        dayBoundsInTimeZone(travelDate);

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
                    "PENDING",
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
                lt(ridesTable.departureAt, endOfDay),
                lte(pickupDistanceSql, 15),
                lte(dropoffDistanceSql, 15),
                driverNotBlockedForViewer(viewerId)
            )
        )
        .orderBy(asc(distanceZoneSql), asc(ridesTable.departureAt));

    // Deduplicate in JS: keep only the combination with the shortest total distance to passenger
    const uniqueRides = new Map<
        string,
        RideSearchResultItem & { _totalDist: number }
    >();

    for (const row of result as RideSearchResultItem[]) {
        const totalDist =
            (row.pickupStop.distanceKm || 0) +
            (row.dropoffStop.distanceKm || 0);
        const existing = uniqueRides.get(row.rideId);

        if (!existing || totalDist < existing._totalDist) {
            uniqueRides.set(row.rideId, { ...row, _totalDist: totalDist });
        }
    }

    const finalRides = Array.from(uniqueRides.values()).map((r) => {
        const { _totalDist, ...cleanRide } = r;
        return cleanRide;
    });

    if (finalRides.length === 0) return [];

    // Fetch actual stops and prices to map back to original if within 25km
    const rideIds = finalRides.map((r) => r.rideId);

    const allStops = await executor
        .select()
        .from(rideStopsTable)
        .where(
            and(
                inArray(rideStopsTable.rideId, rideIds),
                eq(rideStopsTable.isDynamic, false)
            )
        );

    const allPrices = await executor
        .select()
        .from(pricesTable)
        .where(inArray(pricesTable.rideId, rideIds));

    // Haversine formula in JS
    const distanceKm = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const validFinalRides: RideSearchResultItem[] = [];

    for (const ride of finalRides) {
        const stopsForRide = allStops.filter((s) => s.rideId === ride.rideId);

        let actualPickupStop = null;
        let actualDropoffStop = null;

        for (const stop of stopsForRide) {
            if (distanceKm(startLat, startLng, stop.lat, stop.lng) <= 25) {
                actualPickupStop = stop;
                break;
            }
        }

        for (const stop of stopsForRide) {
            if (distanceKm(destLat, destLng, stop.lat, stop.lng) <= 25) {
                actualDropoffStop = stop;
                break;
            }
        }

        if (actualPickupStop) {
            ride.pickupStop.pickupStopId = actualPickupStop.id;
            ride.pickupStop.isDynamic = false;
            ride.pickupStop.city = actualPickupStop.city;
            ride.pickupStop.lat = actualPickupStop.lat;
            ride.pickupStop.lng = actualPickupStop.lng;
            ride.pickupStop.plannedDepartureAt =
                actualPickupStop.plannedDepartureAt ||
                ride.pickupStop.plannedDepartureAt;
            ride.pickupStop.distanceKm = Number(
                distanceKm(
                    startLat,
                    startLng,
                    actualPickupStop.lat,
                    actualPickupStop.lng
                ).toFixed(1)
            );
        }

        if (actualDropoffStop) {
            ride.dropoffStop.dropoffStopId = actualDropoffStop.id;
            ride.dropoffStop.isDynamic = false;
            ride.dropoffStop.city = actualDropoffStop.city;
            ride.dropoffStop.lat = actualDropoffStop.lat;
            ride.dropoffStop.lng = actualDropoffStop.lng;
            ride.dropoffStop.plannedArrivalAt =
                actualDropoffStop.plannedArrivalAt ||
                ride.dropoffStop.plannedArrivalAt;
            ride.dropoffStop.distanceKm = Number(
                distanceKm(
                    destLat,
                    destLng,
                    actualDropoffStop.lat,
                    actualDropoffStop.lng
                ).toFixed(1)
            );
        }

        if (actualPickupStop && actualDropoffStop) {
            if (actualPickupStop.stopOrder > actualDropoffStop.stopOrder) {
                continue;
            }

            const exactPrice = allPrices.find(
                (p) =>
                    p.rideId === ride.rideId &&
                    p.startStopId === actualPickupStop.id &&
                    p.endStopId === actualDropoffStop.id
            );
            if (exactPrice) {
                ride.priceAmount = exactPrice.amount;
            }
        }

        validFinalRides.push(ride);
    }

    return validFinalRides;
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

const insertRideRouteCells = async (
    executor: Executor,
    values: (typeof rideRouteCellsTable.$inferInsert)[]
): Promise<void> => {
    if (values.length === 0) return;
    await executor.insert(rideRouteCellsTable).values(values);
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

const findRideForEnd = async (
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

const updateRideToEnded = async (
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

const findRidesDueForAutoEnd = async (
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

const findOverlappingRidesForDriver = async (
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

export const RideRepository = {
    findRidesByDriverId,
    findRidePassengersBundle,
    findReviewsByAuthorForSubjects,
    findAverageRatingsByUserIds,
    findAvailableRides,
    findPopularRoutes,
    searchRides,
    findActiveCarForDriver,
    insertRide,
    insertRideStops,
    insertRideRouteCells,
    insertRidePrices,
    insertRideStatusHistory,
    findRideForCancel,
    updateRideStatusToCancelled,
    findActiveBookingsByRideId,
    findRideForEnd,
    updateRideToEnded,
    findConfirmedBookingsByRideId,
    findRidesDueForAutoEnd,
    bulkCompleteBookings,
    bulkCancelBookings,
    bulkInsertBookingStatusHistory,
    findOverlappingRidesForDriver,
};
