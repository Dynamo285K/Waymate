export const ReviewErrors = {
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

export type ReviewErrorCode = (typeof ReviewErrors)[keyof typeof ReviewErrors];
