// Wire-level error codes emitted by the API (`{ error: "<CODE>" }`). They must
// match the `RideErrorCodes` string values thrown by the backend ride module.
export const ADMIN_RIDE_NOT_FOUND_CODE = "RIDE_NOT_FOUND";

export const adminRidesErrorMap: Record<string, string> = {
    [ADMIN_RIDE_NOT_FOUND_CODE]: "admin.errors.rideNotFound",
    RIDE_ALREADY_CANCELLED: "admin.errors.rideAlreadyCancelled",
    RIDE_ALREADY_COMPLETED: "admin.errors.rideAlreadyCompleted",
    RIDE_ALREADY_DEPARTED: "admin.errors.rideAlreadyDeparted",
};
