import type {
    AdminUserDetailResponse,
    AdminUserListItem,
    AdminUserListResponse,
} from "@repo/shared";
import { db } from "../../db";
import { AdminError, AdminErrorCodes } from "./admin.errors";
import { AdminRepository } from "./admin.repository";
import type { AdminUserListFilters, SetUserStatusInput } from "./admin.types";

const STATUS_HISTORY_DEFAULT_LIMIT = 50;

const getUserList = async (
    filters: AdminUserListFilters
): Promise<AdminUserListResponse> => {
    let cursorPosition: { id: string; createdAt: Date } | undefined;

    if (filters.cursor) {
        const createdAt = await AdminRepository.findUserCreatedAt(
            db,
            filters.cursor
        );
        // Bogus or invalidated cursor — return an empty page rather than
        // silently restarting from the first row, which would confuse clients.
        if (!createdAt) return { items: [], nextCursor: null };
        cursorPosition = { id: filters.cursor, createdAt };
    }

    // Fetch one extra row to detect whether a next page exists without a
    // separate COUNT(*).
    const rows = await AdminRepository.findUserList(db, {
        limit: filters.limit + 1,
        search: filters.search,
        cursorPosition,
    });

    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items, nextCursor };
};

const getUserDetail = async (
    targetUserId: string
): Promise<AdminUserDetailResponse> => {
    // Read-only fan-out: detail and history are independent SELECTs and can
    // run in parallel without any need for a transaction.
    const [user, statusHistory] = await Promise.all([
        AdminRepository.findUserDetailById(db, targetUserId),
        AdminRepository.findStatusHistoryByUserId(
            db,
            targetUserId,
            STATUS_HISTORY_DEFAULT_LIMIT
        ),
    ]);

    if (!user) {
        throw new AdminError(AdminErrorCodes.UserNotFound);
    }

    return { user, statusHistory };
};

const setUserStatus = async ({
    actorId,
    targetUserId,
    newStatus,
    reason,
}: SetUserStatusInput): Promise<AdminUserListItem> => {
    return await db.transaction(async (tx) => {
        const target = await AdminRepository.findUserById(tx, targetUserId);

        // Defense in depth: repository already excludes the seeded admin from
        // its result set, but the explicit check protects against a future
        // refactor that loosens the filter and silently exposes the admin
        // account to status changes from here.
        if (!target || target.userRole === "ADMIN") {
            throw new AdminError(AdminErrorCodes.UserNotFound);
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
            throw new AdminError(AdminErrorCodes.UserNotFound);
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
    getUserDetail,
    setUserStatus,
};
