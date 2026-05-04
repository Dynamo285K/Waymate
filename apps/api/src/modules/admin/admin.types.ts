import type { AdminUserListItem } from "@repo/shared";
import type { UserRole, UserStatus } from "@repo/shared";

export type AdminUserListFilters = {
    limit: number;
    cursor?: string;
    userRole?: UserRole;
    search?: string;
};

export type SetUserRoleInput = {
    actorId: string;
    targetUserId: string;
    newRole: UserRole;
};

export type SetUserStatusInput = {
    actorId: string;
    targetUserId: string;
    newStatus: UserStatus;
    reason?: string;
};

export type { AdminUserListItem };
