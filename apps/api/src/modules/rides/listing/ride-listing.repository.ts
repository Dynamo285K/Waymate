import { eq, and, isNull, asc, desc, inArray, ne, sql } from "drizzle-orm";
import type { Executor } from "../../../db";
import { rides as ridesTable } from "../../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../../db/schema/ride_stop";
import { bookings as bookingsTable } from "../../../db/schema/booking";
import { reviews as reviewsTable } from "../../../db/schema/review";
import { rideNotSoftDeleted } from "../ride.repository.shared";
import type { RideListItem, RideTimeframe, BookingStatus } from "../ride.types";

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

export const findRidesByDriverId = async (
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

export const findRidePassengersBundle = async (
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

export const findReviewsByAuthorForSubjects = async (
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

export const findAverageRatingsByUserIds = async (
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
