import { DomainError } from "../../shared/errors";

export const ReviewErrorCodes = {
    ReviewNotFound: "REVIEW_NOT_FOUND",
    RideNotFound: "REVIEW_RIDE_NOT_FOUND",
    RideNotCompleted: "REVIEW_RIDE_NOT_COMPLETED",
    RatingWindowClosed: "REVIEW_RATING_WINDOW_CLOSED",
    SelfReviewNotAllowed: "REVIEW_SELF_REVIEW_NOT_ALLOWED",
    AuthorNotInRide: "REVIEW_AUTHOR_NOT_IN_RIDE",
    SubjectNotInRide: "REVIEW_SUBJECT_NOT_IN_RIDE",
    InvalidPairing: "REVIEW_INVALID_PAIRING",
    AlreadyExists: "REVIEW_ALREADY_EXISTS",
} as const;

export type ReviewErrorCode =
    (typeof ReviewErrorCodes)[keyof typeof ReviewErrorCodes];

const REVIEW_ERROR_STATUS: Record<ReviewErrorCode, number> = {
    [ReviewErrorCodes.ReviewNotFound]: 404,
    [ReviewErrorCodes.RideNotFound]: 404,
    [ReviewErrorCodes.AuthorNotInRide]: 403,
    [ReviewErrorCodes.AlreadyExists]: 409,
    [ReviewErrorCodes.RideNotCompleted]: 400,
    [ReviewErrorCodes.RatingWindowClosed]: 400,
    [ReviewErrorCodes.SelfReviewNotAllowed]: 400,
    [ReviewErrorCodes.SubjectNotInRide]: 400,
    [ReviewErrorCodes.InvalidPairing]: 400,
};

export class ReviewError extends DomainError {
    readonly code: ReviewErrorCode;
    constructor(code: ReviewErrorCode) {
        super(code, REVIEW_ERROR_STATUS[code]);
        this.code = code;
    }
}
