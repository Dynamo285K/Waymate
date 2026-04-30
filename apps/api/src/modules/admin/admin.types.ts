import type { AdminUserListItem } from "@repo/shared";
import type { UserRole } from "@repo/shared";

export type AdminUserListFilters = {
    limit: number;
    cursor?: string;
    role?: UserRole;
    search?: string;
};

export type SetUserRoleInput = {
    actorId: string;
    targetUserId: string;
    newRole: UserRole;
};

export type { AdminUserListItem };
