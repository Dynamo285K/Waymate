import { db } from "../../db";
import { hasPostgresErrorCode, PostgresErrorCodes } from "../../db/errors";
import { ReviewRepository } from "./review.repository";
import { ReviewErrors } from "./review.errors";
import type { CreateReviewInput, Review } from "./review.types";

export const REVIEW_WINDOW_DAYS = 14;

const submitReview = async (input: CreateReviewInput): Promise<Review> => {
    if (input.authorId === input.subjectId) {
        throw new Error(ReviewErrors.SelfReviewNotAllowed);
    }

    const ride = await ReviewRepository.findRideContext(db, input.rideId);

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
        !(await ReviewRepository.wasPassengerOnRide(
            db,
            ride.id,
            input.authorId
        ))
    ) {
        throw new Error(ReviewErrors.AuthorNotInRide);
    }

    if (
        !subjectIsDriver &&
        !(await ReviewRepository.wasPassengerOnRide(
            db,
            ride.id,
            input.subjectId
        ))
    ) {
        throw new Error(ReviewErrors.SubjectNotInRide);
    }

    if (authorIsDriver === subjectIsDriver) {
        throw new Error(ReviewErrors.InvalidPairing);
    }

    try {
        return await ReviewRepository.insertReview(db, input);
    } catch (error) {
        if (hasPostgresErrorCode(error, PostgresErrorCodes.UniqueViolation)) {
            throw new Error(ReviewErrors.AlreadyExists);
        }
        throw error;
    }
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
