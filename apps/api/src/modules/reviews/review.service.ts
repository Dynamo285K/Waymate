import { ReviewRepository } from "./review.repository";
import type { CreateReviewInput, Review } from "./review.types";

/**
 * Submits a new review (UC-11).
 */
const submitReview = async (input: CreateReviewInput): Promise<Review> => {
    return await ReviewRepository.createReview(input);
};

/**
 * Returns the public review feed and aggregated rating for a target user.
 */
const getReviewsForUser = async (subjectId: string) => {
    return await ReviewRepository.findReviewsForSubject(subjectId);
};

/**
 * Returns reviews authored by the current user.
 */
const getMyAuthoredReviews = async (authorId: string) => {
    return await ReviewRepository.findReviewsByAuthor(authorId);
};

export const ReviewService = {
    submitReview,
    getReviewsForUser,
    getMyAuthoredReviews,
};
