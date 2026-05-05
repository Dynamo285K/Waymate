import type { UserStatus } from "@repo/shared";

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
