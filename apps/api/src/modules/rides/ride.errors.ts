import { assertNever, DomainError } from "../../shared/errors";

export const RideErrorCodes = {
    CarNotAvailableForDriver: "RIDE_CAR_NOT_AVAILABLE_FOR_DRIVER",
    InvalidPriceStopOrders: "RIDE_INVALID_PRICE_STOP_ORDERS",
    RideNotFound: "RIDE_NOT_FOUND",
    RideNotFoundOrNotOwner: "RIDE_NOT_FOUND_OR_NOT_OWNER",
    RideAlreadyCancelled: "RIDE_ALREADY_CANCELLED",
    RideAlreadyCompleted: "RIDE_ALREADY_COMPLETED",
    RideNotCompletable: "RIDE_NOT_COMPLETABLE",
    RideNotDeparted: "RIDE_NOT_DEPARTED",
    TooManySeats: "RIDE_TOO_MANY_SEATS",
    UnknownCity: "RIDE_UNKNOWN_CITY",
    DriverAlreadyHasRideInTimeframe:
        "RIDE_DRIVER_ALREADY_HAS_RIDE_IN_TIMEFRAME",
} as const;

export type RideErrorCode =
    (typeof RideErrorCodes)[keyof typeof RideErrorCodes];

export class RideError extends DomainError {
    readonly code: RideErrorCode;
    constructor(code: RideErrorCode) {
        super(code);
        this.code = code;
    }
}

export function rideErrorToHttpStatus(code: RideErrorCode): number {
    switch (code) {
        case RideErrorCodes.RideNotFound:
        case RideErrorCodes.RideNotFoundOrNotOwner:
            return 404;
        case RideErrorCodes.CarNotAvailableForDriver:
            return 403;
        case RideErrorCodes.InvalidPriceStopOrders:
        case RideErrorCodes.RideAlreadyCancelled:
        case RideErrorCodes.RideAlreadyCompleted:
        case RideErrorCodes.RideNotCompletable:
        case RideErrorCodes.RideNotDeparted:
        case RideErrorCodes.TooManySeats:
        case RideErrorCodes.UnknownCity:
        case RideErrorCodes.DriverAlreadyHasRideInTimeframe:
            return 400;
        default:
            return assertNever(code);
    }
}
