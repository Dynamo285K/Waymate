import {
    eq,
    and,
    isNull,
    inArray,
    desc,
    aliasedTable,
    gte,
    lt,
    ne,
    sql,
    asc,
} from "drizzle-orm";
import type { Executor } from "../../db";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { rides as ridesTable } from "../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../db/schema/ride_stop";
import { users as usersTable } from "../../db/schema/user";
import { reviews as reviewsTable } from "../../db/schema/review";
import {
    bookingNotSoftDeleted,
    rideNotSoftDeleted,
} from "./booking.repository.shared";
import type {
    DriverRideRequestItem,
    PassengerBookingListRow,
    BookingTimeframe,
} from "./booking.types";

const pickupStops = aliasedTable(rideStopsTable, "booking_pickup_stops");
const dropoffStops = aliasedTable(rideStopsTable, "booking_dropoff_stops");

const myReviewOfDriverTable = aliasedTable(
    reviewsTable,
    "booking_my_review_of_driver"
);

export const findPendingRequestsForDriver = async (
    executor: Executor,
    driverId: string
): Promise<DriverRideRequestItem[]> => {
    const passengerRatings = executor
        .select({
            subjectId: reviewsTable.subjectId,
            averageRating: sql<number>`AVG(${reviewsTable.rating})::float`.as(
                "averageRating"
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
        .as("passenger_ratings");

    const now = new Date();

    const rows = await executor
        .select({
            id: bookingsTable.id,
            rideId: bookingsTable.rideId,
            seatCount: bookingsTable.seatCount,
            priceAmount: bookingsTable.priceAmount,
            currency: bookingsTable.currency,
            passenger: {
                id: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                profilePhotoUrl: usersTable.profilePhotoUrl,
                averageRating: passengerRatings.averageRating,
            },
            pickupCity: pickupStops.city,
            dropoffCity: dropoffStops.city,
            requestedPickupCity: bookingsTable.requestedPickupCity,
            requestedDropoffCity: bookingsTable.requestedDropoffCity,
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
            departureAt: ridesTable.departureAt,
        })
        .from(bookingsTable)
        .innerJoin(ridesTable, eq(bookingsTable.rideId, ridesTable.id))
        .innerJoin(usersTable, eq(bookingsTable.passengerId, usersTable.id))
        .leftJoin(
            passengerRatings,
            eq(passengerRatings.subjectId, usersTable.id)
        )
        .innerJoin(pickupStops, eq(bookingsTable.pickupStopId, pickupStops.id))
        .innerJoin(
            dropoffStops,
            eq(bookingsTable.dropoffStopId, dropoffStops.id)
        )
        .where(
            and(
                eq(ridesTable.driverId, driverId),
                eq(bookingsTable.bookingStatus, "PENDING"),
                gte(ridesTable.departureAt, now),
                eq(ridesTable.rideStatus, "PLANNED"),
                bookingNotSoftDeleted,
                rideNotSoftDeleted
            )
        )
        .orderBy(asc(ridesTable.departureAt), asc(bookingsTable.createdAt));

    return rows as DriverRideRequestItem[];
};

export const findBookingsByPassengerId = async (
    executor: Executor,
    passengerId: string,
    timeframe: BookingTimeframe = "UPCOMING"
): Promise<PassengerBookingListRow[]> => {
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
        .as("capacity_by_ride");

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

    const filters = [
        eq(bookingsTable.passengerId, passengerId),
        bookingNotSoftDeleted,
        rideNotSoftDeleted,
    ];

    if (timeframe === "UPCOMING") {
        filters.push(gte(ridesTable.departureAt, now));
        filters.push(ne(ridesTable.rideStatus, "COMPLETED"));
        filters.push(
            inArray(bookingsTable.bookingStatus, ["PENDING", "CONFIRMED"])
        );
    } else if (timeframe === "PAST") {
        filters.push(lt(ridesTable.departureAt, now));
        filters.push(
            inArray(bookingsTable.bookingStatus, [
                "CONFIRMED",
                "COMPLETED",
                "REJECTED",
                "CANCELLED",
                "NO_SHOW",
            ])
        );
    }

    const rows = await executor
        .select({
            id: bookingsTable.id,
            bookingStatus: bookingsTable.bookingStatus,
            priceAmount: bookingsTable.priceAmount,
            currency: bookingsTable.currency,
            ride: {
                id: ridesTable.id,
                departureAt: ridesTable.departureAt,
                arrivalEstimateAt: ridesTable.arrivalEstimateAt,
                rideStatus: ridesTable.rideStatus,
            },
            driver: {
                id: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                profilePhotoUrl: usersTable.profilePhotoUrl,
                averageRating: driverRatings.averageRating,
                reviewCount: sql<number>`COALESCE(${driverRatings.reviewCount}, 0)::int`,
            },
            pickupCity: pickupStops.city,
            dropoffCity: dropoffStops.city,
            requestedPickupCity: bookingsTable.requestedPickupCity,
            requestedDropoffCity: bookingsTable.requestedDropoffCity,
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
            seatsLeft: sql<number>`GREATEST(0, ${ridesTable.offeredSeats} - COALESCE(${capacityByRide.occupiedSeats}, 0))::int`,
            myReviewOfDriverId: myReviewOfDriverTable.id,
            myReviewOfDriverRating: myReviewOfDriverTable.rating,
        })
        .from(bookingsTable)
        .innerJoin(ridesTable, eq(bookingsTable.rideId, ridesTable.id))
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
        .leftJoin(capacityByRide, eq(capacityByRide.rideId, ridesTable.id))
        .leftJoin(
            driverRatings,
            eq(driverRatings.subjectId, ridesTable.driverId)
        )
        .innerJoin(pickupStops, eq(bookingsTable.pickupStopId, pickupStops.id))
        .innerJoin(
            dropoffStops,
            eq(bookingsTable.dropoffStopId, dropoffStops.id)
        )
        .leftJoin(
            myReviewOfDriverTable,
            and(
                eq(myReviewOfDriverTable.rideId, ridesTable.id),
                eq(myReviewOfDriverTable.authorId, passengerId),
                eq(myReviewOfDriverTable.subjectId, ridesTable.driverId),
                eq(myReviewOfDriverTable.reviewStatus, "VISIBLE")
            )
        )
        .where(and(...filters))
        .orderBy(desc(bookingsTable.createdAt));

    return rows as PassengerBookingListRow[];
};
