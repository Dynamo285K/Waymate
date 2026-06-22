import type { ReviewStatus } from "@repo/shared";

export type AdminReviewListFilters = {
    limit: number;
    cursor?: string;
    status?: ReviewStatus;
    minRating?: number;
    maxRating?: number;
    subjectRole?: "DRIVER" | "PASSENGER";
    search?: string;
};

export type SetReviewStatusInput = {
    actorId: string;
    reviewId: string;
    newStatus: ReviewStatus;
    reason: string;
};
