export const RideErrors = {
    CarNotAvailableForDriver: "RIDE_CAR_NOT_AVAILABLE_FOR_DRIVER",
    InvalidPriceStopOrders: "RIDE_INVALID_PRICE_STOP_ORDERS",
    RideNotFoundOrNotOwner: "RIDE_NOT_FOUND_OR_NOT_OWNER",
    RideAlreadyCancelled: "RIDE_ALREADY_CANCELLED",
} as const;

export type RideErrorCode = (typeof RideErrors)[keyof typeof RideErrors];
