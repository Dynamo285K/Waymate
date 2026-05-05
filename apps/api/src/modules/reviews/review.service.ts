import { db } from "../../db";
import { mapPostgresErrors, PostgresErrorCodes } from "../../db/errors";
import { ReviewRepository } from "./review.repository";
import { ReviewError, ReviewErrorCodes } from "./review.errors";
import type { CreateReviewInput, Review } from "./review.types";

export const REVIEW_WINDOW_DAYS = 14;

const submitReview = async (input: CreateReviewInput): Promise<Review> => {
    if (input.authorId === input.subjectId) {
        throw new ReviewError(ReviewErrorCodes.SelfReviewNotAllowed);
    }

    const ride = await ReviewRepository.findRideContext(db, input.rideId);

    if (!ride) {
        throw new ReviewError(ReviewErrorCodes.RideNotFound);
    }

    if (ride.rideStatus !== "COMPLETED") {
        throw new ReviewError(ReviewErrorCodes.RideNotCompleted);
    }

    const windowClosesAt = new Date(
        ride.departureAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );

    if (new Date() > windowClosesAt) {
        throw new ReviewError(ReviewErrorCodes.RatingWindowClosed);
    }

    const authorIsDriver = ride.driverId === input.authorId;
    const subjectIsDriver = ride.driverId === input.subjectId;

    if (
        !authorIsDriver &&
        !(await ReviewRepository.wasPassengerOnRide(
            db,
            ride.id,
            input.authorId
        ))
    ) {
        throw new ReviewError(ReviewErrorCodes.AuthorNotInRide);
    }

    if (
        !subjectIsDriver &&
        !(await ReviewRepository.wasPassengerOnRide(
            db,
            ride.id,
            input.subjectId
        ))
    ) {
        throw new ReviewError(ReviewErrorCodes.SubjectNotInRide);
    }

    if (authorIsDriver === subjectIsDriver) {
        throw new ReviewError(ReviewErrorCodes.InvalidPairing);
    }

    return mapPostgresErrors(() => ReviewRepository.insertReview(db, input), {
        [PostgresErrorCodes.UniqueViolation]: () => {
            throw new ReviewError(ReviewErrorCodes.AlreadyExists);
        },
    });
};

const getReviewsForUser = async (subjectId: string) => {
    return await ReviewRepository.findReviewsForSubject(db, subjectId);
};

const getMyAuthoredReviews = async (authorId: string) => {
    return await ReviewRepository.findReviewsByAuthor(db, authorId);
};

export const ReviewService = {
    submitReview,
    getReviewsForUser,
    getMyAuthoredReviews,
};
