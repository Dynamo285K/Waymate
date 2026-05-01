import { assertNever, DomainError } from "../../shared/errors";

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

export class ReviewError extends DomainError {
    readonly code: ReviewErrorCode;
    constructor(code: ReviewErrorCode) {
        super(code);
        this.code = code;
    }
}

export function reviewErrorToHttpStatus(code: ReviewErrorCode): number {
    switch (code) {
        case ReviewErrorCodes.ReviewNotFound:
        case ReviewErrorCodes.RideNotFound:
            return 404;
        case ReviewErrorCodes.AuthorNotInRide:
            return 403;
        case ReviewErrorCodes.AlreadyExists:
            return 409;
        case ReviewErrorCodes.RideNotCompleted:
        case ReviewErrorCodes.RatingWindowClosed:
        case ReviewErrorCodes.SelfReviewNotAllowed:
        case ReviewErrorCodes.SubjectNotInRide:
        case ReviewErrorCodes.InvalidPairing:
            return 400;
        default:
            return assertNever(code);
    }
}
