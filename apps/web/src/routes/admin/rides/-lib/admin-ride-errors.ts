export const ADMIN_RIDE_NOT_FOUND_CODE = "ADMIN_RIDE_NOT_FOUND";
export const ADMIN_RIDE_ALREADY_CANCELLED_CODE = "ADMIN_RIDE_ALREADY_CANCELLED";

export const adminRidesErrorMap: Record<string, string> = {
    [ADMIN_RIDE_NOT_FOUND_CODE]: "admin.errors.rideNotFound",
    [ADMIN_RIDE_ALREADY_CANCELLED_CODE]: "admin.errors.rideAlreadyCancelled",
};
