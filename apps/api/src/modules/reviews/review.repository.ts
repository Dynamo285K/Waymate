import { and, avg, count, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Executor } from "../../db";
import { reviews as reviewsTable } from "../../db/schema/review";
import { rides as ridesTable } from "../../db/schema/ride";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { users as usersTable } from "../../db/schema/user";
import type {
    AuthoredReviewListItem,
    CreateReviewInput,
    Review,
    ReviewListItem,
} from "./review.types";

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
        .where(and(eq(ridesTable.id, rideId), isNull(ridesTable.deletedAt)));

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
                isNull(bookingsTable.deletedAt)
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
        eq(reviewsTable.reviewStatus, "VISIBLE")
    );

    const [aggregate] = await executor
        .select({
            averageRating: avg(reviewsTable.rating).mapWith(Number),
            reviewCount: count(reviewsTable.id),
        })
        .from(reviewsTable)
        .where(visibleFilter);

    const rows = await executor
        .select({
            id: reviewsTable.id,
            rideId: reviewsTable.rideId,
            rating: reviewsTable.rating,
            comment: reviewsTable.comment,
            reviewStatus: reviewsTable.reviewStatus,
            createdAt: reviewsTable.createdAt,
            author: {
                id: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                profilePhotoUrl: usersTable.profilePhotoUrl,
            },
        })
        .from(reviewsTable)
        .innerJoin(usersTable, eq(reviewsTable.authorId, usersTable.id))
        .where(visibleFilter)
        .orderBy(desc(reviewsTable.createdAt));

    return {
        averageRating: aggregate?.averageRating ?? null,
        reviewCount: aggregate?.reviewCount ?? 0,
        reviews: rows as ReviewListItem[],
    };
};

const findReviewsByAuthor = async (
    executor: Executor,
    authorId: string
): Promise<AuthoredReviewListItem[]> => {
    const rows = await executor
        .select({
            id: reviewsTable.id,
            rideId: reviewsTable.rideId,
            rating: reviewsTable.rating,
            comment: reviewsTable.comment,
            reviewStatus: reviewsTable.reviewStatus,
            createdAt: reviewsTable.createdAt,
            subject: {
                id: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                profilePhotoUrl: usersTable.profilePhotoUrl,
            },
        })
        .from(reviewsTable)
        .innerJoin(usersTable, eq(reviewsTable.subjectId, usersTable.id))
        .where(eq(reviewsTable.authorId, authorId))
        .orderBy(desc(reviewsTable.createdAt));

    return rows as AuthoredReviewListItem[];
};

export const ReviewRepository = {
    findRideContext,
    wasPassengerOnRide,
    insertReview,
    findReviewsForSubject,
    findReviewsByAuthor,
};
