export const BookingErrors = {
    BookingNotFound: "BOOKING_NOT_FOUND",
    RideNotFoundOrUnavailable: "BOOKING_RIDE_NOT_FOUND_OR_UNAVAILABLE",
    NotEnoughSeats: "BOOKING_NOT_ENOUGH_SEATS",
    InvalidStops: "BOOKING_INVALID_STOPS",
    AlreadyBooked: "BOOKING_ALREADY_EXISTS",
    UnauthorizedAction: "BOOKING_UNAUTHORIZED_ACTION",
    AlreadyCancelled: "BOOKING_ALREADY_CANCELLED",
    InvalidStatusTransition: "BOOKING_INVALID_STATUS_TRANSITION",
    PriceNotFound: "BOOKING_PRICE_NOT_FOUND",
} as const;

export type BookingErrorCode = (typeof BookingErrors)[keyof typeof BookingErrors];