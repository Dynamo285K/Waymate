import {
    and,
    aliasedTable,
    avg,
    count,
    desc,
    eq,
    inArray,
    isNull,
    sql,
} from "drizzle-orm";
import type { Executor } from "../../db";
import { reviews as reviewsTable } from "../../db/schema/review";
import { rides as ridesTable } from "../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../db/schema/ride_stop";
import { cities as citiesTable } from "../../db/schema/city";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { users as usersTable } from "../../db/schema/user";
import type {
    AuthoredReviewListItem,
    CreateReviewInput,
    Review,
    ReviewListItem,
} from "./review.types";

const rideNotSoftDeleted = isNull(ridesTable.deletedAt);
const bookingNotSoftDeleted = isNull(bookingsTable.deletedAt);

export type RideContext = {
    id: string;
    driverId: string;
    rideStatus: string;
    departureAt: Date;
};

const findRideContext = async (
    executor: Executor,
    rideId: string
): Promise<RideContext | null> => {
    const [ride] = await executor
        .select({
            id: ridesTable.id,
            driverId: ridesTable.driverId,
            rideStatus: ridesTable.rideStatus,
            departureAt: ridesTable.departureAt,
        })
        .from(ridesTable)
        .where(and(eq(ridesTable.id, rideId), rideNotSoftDeleted));

    return ride ?? null;
};

const wasPassengerOnRide = async (
    executor: Executor,
    rideId: string,
    userId: string
): Promise<boolean> => {
    const [row] = await executor
        .select({ id: bookingsTable.id })
        .from(bookingsTable)
        .where(
            and(
                eq(bookingsTable.rideId, rideId),
                eq(bookingsTable.passengerId, userId),
                inArray(bookingsTable.bookingStatus, [
                    "CONFIRMED",
                    "COMPLETED",
                ]),
                bookingNotSoftDeleted
            )
        )
        .limit(1);

    return Boolean(row);
};

const insertReview = async (
    executor: Executor,
    input: CreateReviewInput
): Promise<Review> => {
    const [newReview] = await executor
        .insert(reviewsTable)
        .values({
            rideId: input.rideId,
            authorId: input.authorId,
            subjectId: input.subjectId,
            rating: input.rating,
            comment: input.comment ?? null,
            reviewStatus: "VISIBLE",
        })
        .returning();

    return newReview as Review;
};

const findReviewsForSubject = async (
    executor: Executor,
    subjectId: string
): Promise<{
    averageRating: number | null;
    reviewCount: number;
    reviews: ReviewListItem[];
}> => {
    const visibleFilter = and(
        eq(reviewsTable.subjectId, subjectId),
        eq(reviewsTable.reviewStatus, "VISIBLE"),
        isNull(reviewsTable.deletedAt)
    );

    const [aggregate] = await executor
        .select({
            averageRating: avg(reviewsTable.rating).mapWith(Number),
            reviewCount: count(reviewsTable.id),
        })
        .from(reviewsTable)
        .where(visibleFilter);

    const originStops = aliasedTable(rideStopsTable, "rv_origin_stops");
    const destStops = aliasedTable(rideStopsTable, "rv_dest_stops");
    const originCities = aliasedTable(citiesTable, "rv_origin_cities");
    const destCities = aliasedTable(citiesTable, "rv_dest_cities");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("rv_last_stops");

    const rows = await executor
        .select({
            id: reviewsTable.id,
            rideId: reviewsTable.rideId,
            rating: reviewsTable.rating,
            comment: reviewsTable.comment,
            reviewStatus: reviewsTable.reviewStatus,
            createdAt: reviewsTable.createdAt,
            authorId: usersTable.id,
            authorFirstName: usersTable.firstName,
            authorLastName: usersTable.lastName,
            authorProfilePhotoUrl: usersTable.profilePhotoUrl,
            originCity: originCities.name,
            destinationCity: destCities.name,
        })
        .from(reviewsTable)
        .innerJoin(usersTable, eq(reviewsTable.authorId, usersTable.id))
        .innerJoin(ridesTable, eq(reviewsTable.rideId, ridesTable.id))
        .innerJoin(
            originStops,
            and(
                eq(originStops.rideId, ridesTable.id),
                eq(originStops.stopOrder, 0)
            )
        )
        .innerJoin(originCities, eq(originCities.id, originStops.cityId))
        .innerJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .innerJoin(
            destStops,
            and(
                eq(destStops.rideId, ridesTable.id),
                eq(destStops.stopOrder, lastStopOrders.stopOrder)
            )
        )
        .innerJoin(destCities, eq(destCities.id, destStops.cityId))
        .where(visibleFilter)
        .orderBy(desc(reviewsTable.createdAt));

    return {
        averageRating: aggregate?.averageRating ?? null,
        reviewCount: aggregate?.reviewCount ?? 0,
        reviews: rows.map((row) => ({
            id: row.id,
            rideId: row.rideId,
            rating: row.rating,
            comment: row.comment,
            reviewStatus: row.reviewStatus,
            createdAt: row.createdAt,
            author: {
                id: row.authorId,
                firstName: row.authorFirstName,
                lastName: row.authorLastName,
                profilePhotoUrl: row.authorProfilePhotoUrl,
            },
            ride: {
                originCity: row.originCity,
                destinationCity: row.destinationCity,
            },
        })) as ReviewListItem[],
    };
};

const findReviewsByAuthor = async (
    executor: Executor,
    authorId: string
): Promise<AuthoredReviewListItem[]> => {
    const originStops = aliasedTable(rideStopsTable, "ra_origin_stops");
    const destStops = aliasedTable(rideStopsTable, "ra_dest_stops");
    const originCities = aliasedTable(citiesTable, "ra_origin_cities");
    const destCities = aliasedTable(citiesTable, "ra_dest_cities");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("ra_last_stops");

    const rows = await executor
        .select({
            id: reviewsTable.id,
            rideId: reviewsTable.rideId,
            rating: reviewsTable.rating,
            comment: reviewsTable.comment,
            reviewStatus: reviewsTable.reviewStatus,
            createdAt: reviewsTable.createdAt,
            subjectId: usersTable.id,
            subjectFirstName: usersTable.firstName,
            subjectLastName: usersTable.lastName,
            subjectProfilePhotoUrl: usersTable.profilePhotoUrl,
            originCity: originCities.name,
            destinationCity: destCities.name,
        })
        .from(reviewsTable)
        .innerJoin(usersTable, eq(reviewsTable.subjectId, usersTable.id))
        .innerJoin(ridesTable, eq(reviewsTable.rideId, ridesTable.id))
        .innerJoin(
            originStops,
            and(
                eq(originStops.rideId, ridesTable.id),
                eq(originStops.stopOrder, 0)
            )
        )
        .innerJoin(originCities, eq(originCities.id, originStops.cityId))
        .innerJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .innerJoin(
            destStops,
            and(
                eq(destStops.rideId, ridesTable.id),
                eq(destStops.stopOrder, lastStopOrders.stopOrder)
            )
        )
        .innerJoin(destCities, eq(destCities.id, destStops.cityId))
        .where(eq(reviewsTable.authorId, authorId))
        .orderBy(desc(reviewsTable.createdAt));

    return rows.map((row) => ({
        id: row.id,
        rideId: row.rideId,
        rating: row.rating,
        comment: row.comment,
        reviewStatus: row.reviewStatus,
        createdAt: row.createdAt,
        subject: {
            id: row.subjectId,
            firstName: row.subjectFirstName,
            lastName: row.subjectLastName,
            profilePhotoUrl: row.subjectProfilePhotoUrl,
        },
        ride: {
            originCity: row.originCity,
            destinationCity: row.destinationCity,
        },
    })) as AuthoredReviewListItem[];
};

export const ReviewRepository = {
    findRideContext,
    wasPassengerOnRide,
    insertReview,
    findReviewsForSubject,
    findReviewsByAuthor,
};
