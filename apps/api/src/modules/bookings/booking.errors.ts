import { assertNever, DomainError } from "../../shared/errors";

export const BookingErrorCodes = {
    BookingNotFound: "BOOKING_NOT_FOUND",
    RideNotFoundOrUnavailable: "BOOKING_RIDE_NOT_FOUND_OR_UNAVAILABLE",
    NotEnoughSeats: "BOOKING_NOT_ENOUGH_SEATS",
    InvalidStops: "BOOKING_INVALID_STOPS",
    AlreadyBooked: "BOOKING_ALREADY_EXISTS",
    UnauthorizedAction: "BOOKING_UNAUTHORIZED_ACTION",
    AlreadyCancelled: "BOOKING_ALREADY_CANCELLED",
    InvalidStatusTransition: "BOOKING_INVALID_STATUS_TRANSITION",
    PriceNotFound: "BOOKING_PRICE_NOT_FOUND",
    SelfBookingNotAllowed: "BOOKING_SELF_BOOKING_NOT_ALLOWED",
} as const;

export type BookingErrorCode =
    (typeof BookingErrorCodes)[keyof typeof BookingErrorCodes];

export class BookingError extends DomainError {
    readonly code: BookingErrorCode;
    constructor(code: BookingErrorCode) {
        super(code);
        this.code = code;
    }
}

export function bookingErrorToHttpStatus(code: BookingErrorCode): number {
    switch (code) {
        case BookingErrorCodes.BookingNotFound:
        case BookingErrorCodes.RideNotFoundOrUnavailable:
            return 404;
        case BookingErrorCodes.UnauthorizedAction:
            return 403;
        case BookingErrorCodes.NotEnoughSeats:
        case BookingErrorCodes.AlreadyBooked:
            return 409;
        case BookingErrorCodes.InvalidStops:
        case BookingErrorCodes.AlreadyCancelled:
        case BookingErrorCodes.InvalidStatusTransition:
        case BookingErrorCodes.PriceNotFound:
        case BookingErrorCodes.SelfBookingNotAllowed:
            return 400;
        default:
            return assertNever(code);
    }
}
