import type { ReviewStatus, RideStatus, UserStatus } from "@repo/shared";

export type AdminUserListFilters = {
    limit: number;
    cursor?: string;
    search?: string;
};

export type SetUserStatusInput = {
    actorId: string;
    targetUserId: string;
    newStatus: UserStatus;
    reason?: string;
};

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

export type AdminReviewListFilters = {
    limit: number;
    cursor?: string;
    status?: ReviewStatus;
    minRating?: number;
    maxRating?: number;
    search?: string;
};

export type SetReviewStatusInput = {
    actorId: string;
    reviewId: string;
    newStatus: ReviewStatus;
    reason: string;
};
