import { and, avg, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db";
import { reviews as reviewsTable } from "../../db/schema/review";
import { rides as ridesTable } from "../../db/schema/ride";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { users as usersTable } from "../../db/schema/user";
import { ReviewErrors } from "./review.errors";
import { hasPostgresErrorCode, PostgresErrorCodes } from "../../db/errors";
import type {
    AuthoredReviewListItem,
    CreateReviewInput,
    Review,
    ReviewListItem,
} from "./review.types";

// Rating window in days after the ride's departure (UC-11 6a).
export const REVIEW_WINDOW_DAYS = 14;

type RideContext = {
    id: string;
    driverId: string;
    rideStatus: string;
    departureAt: Date;
};

const fetchRideContext = async (
    rideId: string
): Promise<RideContext | null> => {
    const [ride] = await db
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
    rideId: string,
    userId: string
): Promise<boolean> => {
    const [row] = await db
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

/**
 * Creates a new review (rating 1..5 + optional comment).
 *
 * Validates that:
 * - the ride exists and is COMPLETED (cancelled rides cannot be reviewed),
 * - the rating window has not expired,
 * - both author and subject participated in the ride together (driver↔passenger),
 * - no review by this author for this subject on this ride exists yet.
 */
const createReview = async (input: CreateReviewInput): Promise<Review> => {
    if (input.authorId === input.subjectId) {
        throw new Error(ReviewErrors.SelfReviewNotAllowed);
    }

    const ride = await fetchRideContext(input.rideId);

    if (!ride) {
        throw new Error(ReviewErrors.RideNotFound);
    }

    if (ride.rideStatus !== "COMPLETED") {
        throw new Error(ReviewErrors.RideNotCompleted);
    }

    const windowClosesAt = new Date(
        ride.departureAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    if (new Date() > windowClosesAt) {
        throw new Error(ReviewErrors.RatingWindowClosed);
    }

    const authorIsDriver = ride.driverId === input.authorId;
    const subjectIsDriver = ride.driverId === input.subjectId;

    if (
        !authorIsDriver &&
        !(await wasPassengerOnRide(ride.id, input.authorId))
    ) {
        throw new Error(ReviewErrors.AuthorNotInRide);
    }

    if (
        !subjectIsDriver &&
        !(await wasPassengerOnRide(ride.id, input.subjectId))
    ) {
        throw new Error(ReviewErrors.SubjectNotInRide);
    }

    // UC-11: only driver↔passenger pairs may rate each other.
    if (authorIsDriver === subjectIsDriver) {
        throw new Error(ReviewErrors.InvalidPairing);
    }

    try {
        const [newReview] = await db
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
    } catch (error) {
        if (hasPostgresErrorCode(error, PostgresErrorCodes.UniqueViolation)) {
            throw new Error(ReviewErrors.AlreadyExists);
        }
        throw error;
    }
};

/**
 * Returns the visible reviews for a target user along with the aggregated rating.
 */
const findReviewsForSubject = async (
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

    const [aggregate] = await db
        .select({
            averageRating: avg(reviewsTable.rating).mapWith(Number),
            reviewCount: count(reviewsTable.id),
        })
        .from(reviewsTable)
        .where(visibleFilter);

    const rows = await db
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

/**
 * Returns the reviews authored by a given user (regardless of visibility).
 */
const findReviewsByAuthor = async (
    authorId: string
): Promise<AuthoredReviewListItem[]> => {
    const rows = await db
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
    createReview,
    findReviewsForSubject,
    findReviewsByAuthor,
};
