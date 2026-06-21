import type {
    AdminUserDetailResponse,
    AdminUserListItem,
    AdminUserListResponse,
} from "@repo/shared";
import { db } from "../../../db";
import { AdminError, AdminErrorCodes } from "../admin.errors";
import { AdminUserRepository } from "./admin-user.repository";
import type { AdminUserListFilters, SetUserStatusInput } from "../admin.types";

const STATUS_HISTORY_DEFAULT_LIMIT = 50;

const getUserList = async (
    filters: AdminUserListFilters
): Promise<AdminUserListResponse> => {
    let cursorPosition: { id: string; createdAt: Date } | undefined;

    if (filters.cursor) {
        const createdAt = await AdminUserRepository.findUserCreatedAt(
            db,
            filters.cursor
        );
        if (!createdAt) return { items: [], nextCursor: null };
        cursorPosition = { id: filters.cursor, createdAt };
    }

    const rows = await AdminUserRepository.findUserList(db, {
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
    const [user, statusHistory] = await Promise.all([
        AdminUserRepository.findUserDetailById(db, targetUserId),
        AdminUserRepository.findStatusHistoryByUserId(
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
        const target = await AdminUserRepository.findUserById(tx, targetUserId);

        if (!target || target.userRole === "ADMIN") {
            throw new AdminError(AdminErrorCodes.UserNotFound);
        }

        if (target.userStatus === newStatus) {
            return target;
        }

        const updated = await AdminUserRepository.updateUserStatus(
            tx,
            targetUserId,
            newStatus,
            reason
        );

        if (!updated) {
            throw new AdminError(AdminErrorCodes.UserNotFound);
        }

        await AdminUserRepository.insertUserStatusHistory(tx, {
            userId: targetUserId,
            oldStatus: target.userStatus,
            newStatus,
            changedByUserId: actorId,
            reason,
        });

        if (newStatus === "BANNED" || newStatus === "DELETED") {
            await AdminUserRepository.deleteSessionsByUserId(tx, targetUserId);
        }

        return updated;
    });
};

export const AdminUserService = {
    getUserList,
    getUserDetail,
    setUserStatus,
};
