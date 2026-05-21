import {
    eq,
    and,
    isNull,
    inArray,
    desc,
    aliasedTable,
    gte,
    lt,
    sql,
    asc,
} from "drizzle-orm";
import type { Executor } from "../../db";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { rides as ridesTable } from "../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../db/schema/ride_stop";
import { prices as pricesTable } from "../../db/schema/price";
import { users as usersTable } from "../../db/schema/user";
import { reviews as reviewsTable } from "../../db/schema/review";
import { cities as citiesTable } from "../../db/schema/city";
import { bookingStatusHistory as bookingStatusHistoryTable } from "../../db/schema";
import type {
    DriverRideRequestItem,
    PassengerBookingListRow,
    BookingTimeframe,
    BookingStatus,
} from "./booking.types";

const bookingNotSoftDeleted = isNull(bookingsTable.deletedAt);
const rideNotSoftDeleted = isNull(ridesTable.deletedAt);

const pickupStops = aliasedTable(rideStopsTable, "booking_pickup_stops");
const dropoffStops = aliasedTable(rideStopsTable, "booking_dropoff_stops");
const pickupCities = aliasedTable(citiesTable, "booking_pickup_cities");
const dropoffCities = aliasedTable(citiesTable, "booking_dropoff_cities");
const myReviewOfDriverTable = aliasedTable(
    reviewsTable,
    "booking_my_review_of_driver"
);

export type RideForBookingContext = {
    id: string;
    driverId: string;
    rideStatus: string;
    offeredSeats: number;
};

export type BookingRow = typeof bookingsTable.$inferSelect;

const findPendingRequestsForDriver = async (
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

    const rows = await executor
        .select({
            id: bookingsTable.id,
            rideId: bookingsTable.rideId,
            seatCount: bookingsTable.seatCount,
            passenger: {
                id: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                profilePhotoUrl: usersTable.profilePhotoUrl,
                averageRating: passengerRatings.averageRating,
            },
            pickupCity: pickupCities.name,
            dropoffCity: dropoffCities.name,
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
        .innerJoin(pickupCities, eq(pickupCities.id, pickupStops.cityId))
        .innerJoin(
            dropoffStops,
            eq(bookingsTable.dropoffStopId, dropoffStops.id)
        )
        .innerJoin(dropoffCities, eq(dropoffCities.id, dropoffStops.cityId))
        .where(
            and(
                eq(ridesTable.driverId, driverId),
                eq(bookingsTable.bookingStatus, "PENDING"),
                bookingNotSoftDeleted,
                rideNotSoftDeleted
            )
        )
        .orderBy(asc(ridesTable.departureAt), asc(bookingsTable.createdAt));

    return rows as DriverRideRequestItem[];
};

const findBookingsByPassengerId = async (
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
            pickupCity: pickupCities.name,
            dropoffCity: dropoffCities.name,
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
        .innerJoin(pickupCities, eq(pickupCities.id, pickupStops.cityId))
        .innerJoin(
            dropoffStops,
            eq(bookingsTable.dropoffStopId, dropoffStops.id)
        )
        .innerJoin(dropoffCities, eq(dropoffCities.id, dropoffStops.cityId))
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

const lockRideForBooking = async (
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

const lockBookingById = async (
    executor: Executor,
    bookingId: string
): Promise<BookingRow | null> => {
    const [booking] = await executor
        .select()
        .from(bookingsTable)
        .where(and(eq(bookingsTable.id, bookingId), bookingNotSoftDeleted))
        .for("update");

    return booking ?? null;
};

const findRideStops = async (
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

const findSegmentPrice = async (
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

const sumSeatsForRide = async (
    executor: Executor,
    rideId: string,
    statuses: BookingStatus[]
): Promise<number> => {
    const rows = await executor
        .select({ seatCount: bookingsTable.seatCount })
        .from(bookingsTable)
        .where(
            and(
                eq(bookingsTable.rideId, rideId),
                inArray(bookingsTable.bookingStatus, statuses),
                bookingNotSoftDeleted
            )
        );

    return rows.reduce((sum, b) => sum + b.seatCount, 0);
};

const findActiveBookingByPassenger = async (
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

const insertBooking = async (
    executor: Executor,
    values: {
        passengerId: string;
        rideId: string;
        pickupStopId: string;
        dropoffStopId: string;
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

// Whitelisted update surface for booking status transitions. The previous
// `Partial<typeof bookingsTable.$inferInsert>` shape leaked the entire row
// (including `id`, `passengerId`, `deletedAt` etc.) — anything outside this
// list of legitimate transition fields would have type-checked silently.
type BookingTransitionFields = Partial<
    Pick<
        typeof bookingsTable.$inferInsert,
        | "bookingStatus"
        | "confirmedAt"
        | "cancelledAt"
        | "cancelledByUserId"
        | "cancellationReason"
    >
>;

const updateBookingFields = async (
    executor: Executor,
    bookingId: string,
    fields: BookingTransitionFields
): Promise<{ id: string } | null> => {
    const [updatedBooking] = await executor
        .update(bookingsTable)
        .set(fields)
        .where(and(eq(bookingsTable.id, bookingId), bookingNotSoftDeleted))
        .returning({ id: bookingsTable.id });

    return updatedBooking ?? null;
};

const insertBookingStatusHistory = async (
    executor: Executor,
    values: {
        bookingId: string;
        oldStatus?: BookingStatus;
        newStatus: BookingStatus;
        changedByUserId: string;
        reason: string;
    }
): Promise<void> => {
    await executor.insert(bookingStatusHistoryTable).values(values);
};

export const BookingRepository = {
    findPendingRequestsForDriver,
    findBookingsByPassengerId,
    lockRideForBooking,
    lockBookingById,
    findRideStops,
    findSegmentPrice,
    sumSeatsForRide,
    findActiveBookingByPassenger,
    insertBooking,
    updateBookingFields,
    insertBookingStatusHistory,
};
