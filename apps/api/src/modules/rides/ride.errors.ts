import { DomainError } from "../../shared/errors";

export const RideErrorCodes = {
    CarNotAvailableForDriver: "RIDE_CAR_NOT_AVAILABLE_FOR_DRIVER",
    InvalidPriceStopOrders: "RIDE_INVALID_PRICE_STOP_ORDERS",
    RideNotFound: "RIDE_NOT_FOUND",
    RideNotFoundOrNotOwner: "RIDE_NOT_FOUND_OR_NOT_OWNER",
    RideAlreadyCancelled: "RIDE_ALREADY_CANCELLED",
    RideAlreadyCompleted: "RIDE_ALREADY_COMPLETED",
    RideAlreadyDeparted: "RIDE_ALREADY_DEPARTED",
    RideNotCompletable: "RIDE_NOT_COMPLETABLE",
    RideNotDeparted: "RIDE_NOT_DEPARTED",
    TooManySeats: "RIDE_TOO_MANY_SEATS",
    UnknownCity: "RIDE_UNKNOWN_CITY",
    DriverAlreadyHasRideInTimeframe:
        "RIDE_DRIVER_ALREADY_HAS_RIDE_IN_TIMEFRAME",
} as const;

export type RideErrorCode =
    (typeof RideErrorCodes)[keyof typeof RideErrorCodes];

const RIDE_ERROR_STATUS: Record<RideErrorCode, number> = {
    [RideErrorCodes.RideNotFound]: 404,
    [RideErrorCodes.RideNotFoundOrNotOwner]: 404,
    [RideErrorCodes.CarNotAvailableForDriver]: 403,
    [RideErrorCodes.InvalidPriceStopOrders]: 400,
    [RideErrorCodes.RideAlreadyCancelled]: 400,
    [RideErrorCodes.RideAlreadyCompleted]: 400,
    [RideErrorCodes.RideAlreadyDeparted]: 400,
    [RideErrorCodes.RideNotCompletable]: 400,
    [RideErrorCodes.RideNotDeparted]: 400,
    [RideErrorCodes.TooManySeats]: 400,
    [RideErrorCodes.UnknownCity]: 400,
    [RideErrorCodes.DriverAlreadyHasRideInTimeframe]: 400,
};

export class RideError extends DomainError {
    readonly code: RideErrorCode;
    constructor(code: RideErrorCode) {
        super(code, RIDE_ERROR_STATUS[code]);
        this.code = code;
    }
}
