import type { RideStatus } from "@repo/shared";

export type AdminRideListFilters = {
    limit: number;
    cursor?: string;
    status?: RideStatus;
    search?: string;
};

export type AdminCancelRideInput = {
    actorId: string;
    rideId: string;
    reason: string;
};
