import type { AdminUserListItem, AdminUserListResponse } from "@repo/shared";
import { db } from "../../db";
import { AdminErrors } from "./admin.errors";
import { AdminRepository } from "./admin.repository";
import type {
    AdminUserListFilters,
    SetUserRoleInput,
    SetUserStatusInput,
} from "./admin.types";

const getUserList = async (
    filters: AdminUserListFilters
): Promise<AdminUserListResponse> => {
    // Fetch one extra row to detect whether a next page exists without a
    // separate COUNT(*).
    const rows = await AdminRepository.findUserList(db, {
        ...filters,
        limit: filters.limit + 1,
    });

    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items, nextCursor };
};

const setUserRole = async ({
    actorId,
    targetUserId,
    newRole,
}: SetUserRoleInput): Promise<AdminUserListItem> => {
    const target = await AdminRepository.findUserById(db, targetUserId);

    if (!target) {
        throw new Error(AdminErrors.UserNotFound);
    }

    // Cheapest guarantee that at least one admin remains: an admin can never
    // demote themselves, so the last admin can't lock the tooling out.
    if (actorId === targetUserId && newRole !== "ADMIN") {
        throw new Error(AdminErrors.CannotDemoteSelf);
    }

    // Idempotent: skip the UPDATE so updatedAt only reflects real changes.
    if (target.role === newRole) {
        return target;
    }

    const updated = await AdminRepository.updateUserRole(
        db,
        targetUserId,
        newRole
    );

    if (!updated) {
        // Race: target was soft-deleted between our existence check and update.
        throw new Error(AdminErrors.UserNotFound);
    }

    return updated;
};

const setUserStatus = async ({
    actorId,
    targetUserId,
    newStatus,
    reason,
}: SetUserStatusInput): Promise<AdminUserListItem> => {
    // Admins can't change their own status — same spirit as CannotDemoteSelf,
    // prevents an admin from locking themselves out of the tooling by mistake.
    if (actorId === targetUserId) {
        throw new Error(AdminErrors.CannotChangeOwnStatus);
    }

    return await db.transaction(async (tx) => {
        const target = await AdminRepository.findUserById(tx, targetUserId);

        if (!target) {
            throw new Error(AdminErrors.UserNotFound);
        }

        // Idempotent: skip both the UPDATE and the audit row so updatedAt and
        // user_status_history only reflect real transitions.
        if (target.userStatus === newStatus) {
            return target;
        }

        const updated = await AdminRepository.updateUserStatus(
            tx,
            targetUserId,
            newStatus
        );

        if (!updated) {
            // Race: target was soft-deleted between the existence check and
            // the update. Roll back to leave history consistent with users.
            throw new Error(AdminErrors.UserNotFound);
        }

        await AdminRepository.insertUserStatusHistory(tx, {
            userId: targetUserId,
            oldStatus: target.userStatus,
            newStatus,
            changedByUserId: actorId,
            reason,
        });

        return updated;
    });
};

export const AdminService = {
    getUserList,
    setUserRole,
    setUserStatus,
};
