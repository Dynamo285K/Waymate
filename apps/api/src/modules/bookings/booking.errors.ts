import { DomainError } from "../../shared/errors";

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
    Blocked: "BOOKING_BLOCKED",
} as const;

export type BookingErrorCode =
    (typeof BookingErrorCodes)[keyof typeof BookingErrorCodes];

const BOOKING_ERROR_STATUS: Record<BookingErrorCode, number> = {
    [BookingErrorCodes.BookingNotFound]: 404,
    [BookingErrorCodes.RideNotFoundOrUnavailable]: 404,
    [BookingErrorCodes.UnauthorizedAction]: 403,
    [BookingErrorCodes.Blocked]: 403,
    [BookingErrorCodes.NotEnoughSeats]: 409,
    [BookingErrorCodes.AlreadyBooked]: 409,
    [BookingErrorCodes.InvalidStops]: 400,
    [BookingErrorCodes.AlreadyCancelled]: 400,
    [BookingErrorCodes.InvalidStatusTransition]: 400,
    [BookingErrorCodes.PriceNotFound]: 400,
    [BookingErrorCodes.SelfBookingNotAllowed]: 400,
};

export class BookingError extends DomainError {
    readonly code: BookingErrorCode;
    constructor(code: BookingErrorCode) {
        super(code, BOOKING_ERROR_STATUS[code]);
        this.code = code;
    }
}
