import {
    aliasedTable,
    and,
    desc,
    eq,
    ilike,
    inArray,
    isNull,
    lt,
    ne,
    or,
} from "drizzle-orm";
import type {
    AdminUserDetail,
    AdminUserListItem,
    AdminUserStatusHistoryItem,
    UserStatus,
    RideStatus,
} from "@repo/shared";
import type { Executor } from "../../../db";
import { users as usersTable } from "../../../db/schema/user";
import { userStatusHistory as userStatusHistoryTable } from "../../../db/schema/user_status_history";
import { sessions as sessionsTable } from "../../../db/schema/session";
import { rides as ridesTable } from "../../../db/schema/ride";
import { rideStatusHistory as rideStatusHistoryTable } from "../../../db/schema/ride_status_history";
import { bookings as bookingsTable } from "../../../db/schema/booking";

const adminUserListColumns = {
    id: usersTable.id,
    email: usersTable.email,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    userRole: usersTable.userRole,
    userStatus: usersTable.userStatus,
    createdAt: usersTable.createdAt,
    lastActiveAt: usersTable.lastActiveAt,
} as const;

const adminUserDetailColumns = {
    id: usersTable.id,
    email: usersTable.email,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    displayName: usersTable.displayName,
    phone: usersTable.phone,
    bio: usersTable.bio,
    profilePhotoUrl: usersTable.profilePhotoUrl,
    userRole: usersTable.userRole,
    userStatus: usersTable.userStatus,
    emailVerifiedAt: usersTable.emailVerifiedAt,
    phoneVerifiedAt: usersTable.phoneVerifiedAt,
    lastActiveAt: usersTable.lastActiveAt,
    createdAt: usersTable.createdAt,
    updatedAt: usersTable.updatedAt,
} as const;

const visibleUserConditions = [
    isNull(usersTable.deletedAt),
    ne(usersTable.userRole, "ADMIN"),
];

const findUserList = async (
    executor: Executor,
    params: {
        limit: number;
        search?: string;
        cursorPosition?: { id: string; createdAt: Date };
    }
): Promise<AdminUserListItem[]> => {
    const conditions = [...visibleUserConditions];

    if (params.search) {
        const pattern = `%${params.search}%`;
        const searchClause = or(
            ilike(usersTable.email, pattern),
            ilike(usersTable.firstName, pattern),
            ilike(usersTable.lastName, pattern)
        );
        if (searchClause) conditions.push(searchClause);
    }

    if (params.cursorPosition) {
        const cursorClause = or(
            lt(usersTable.createdAt, params.cursorPosition.createdAt),
            and(
                eq(usersTable.createdAt, params.cursorPosition.createdAt),
                lt(usersTable.id, params.cursorPosition.id)
            )
        );
        if (cursorClause) conditions.push(cursorClause);
    }

    return await executor
        .select(adminUserListColumns)
        .from(usersTable)
        .where(and(...conditions))
        .orderBy(desc(usersTable.createdAt), desc(usersTable.id))
        .limit(params.limit);
};

const findUserCreatedAt = async (
    executor: Executor,
    id: string
): Promise<Date | null> => {
    const [row] = await executor
        .select({ createdAt: usersTable.createdAt })
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);

    return row?.createdAt ?? null;
};

const findUserById = async (
    executor: Executor,
    id: string
): Promise<AdminUserListItem | null> => {
    const [user] = await executor
        .select(adminUserListColumns)
        .from(usersTable)
        .where(and(eq(usersTable.id, id), ...visibleUserConditions))
        .limit(1);

    return user ?? null;
};

const findUserDetailById = async (
    executor: Executor,
    id: string
): Promise<AdminUserDetail | null> => {
    const [user] = await executor
        .select(adminUserDetailColumns)
        .from(usersTable)
        .where(and(eq(usersTable.id, id), ...visibleUserConditions))
        .limit(1);

    return user ?? null;
};

const findStatusHistoryByUserId = async (
    executor: Executor,
    userId: string,
    limit: number
): Promise<AdminUserStatusHistoryItem[]> => {
    const actor = aliasedTable(usersTable, "actor");

    const rows = await executor
        .select({
            id: userStatusHistoryTable.id,
            oldStatus: userStatusHistoryTable.oldStatus,
            newStatus: userStatusHistoryTable.newStatus,
            reason: userStatusHistoryTable.reason,
            createdAt: userStatusHistoryTable.createdAt,
            actorId: actor.id,
            actorFirstName: actor.firstName,
            actorLastName: actor.lastName,
        })
        .from(userStatusHistoryTable)
        .leftJoin(actor, eq(userStatusHistoryTable.changedByUserId, actor.id))
        .where(eq(userStatusHistoryTable.userId, userId))
        .orderBy(desc(userStatusHistoryTable.createdAt))
        .limit(limit);

    return rows.map((row) => ({
        id: row.id,
        oldStatus: row.oldStatus,
        newStatus: row.newStatus,
        reason: row.reason,
        createdAt: row.createdAt,
        changedBy: row.actorId
            ? {
                  id: row.actorId,
                  firstName: row.actorFirstName,
                  lastName: row.actorLastName,
              }
            : null,
    }));
};

const updateUserStatus = async (
    executor: Executor,
    id: string,
    status: UserStatus,
    reason?: string
): Promise<AdminUserListItem | null> => {
    const isBanned = status === "BANNED";
    const [updated] = await executor
        .update(usersTable)
        .set({
            userStatus: status,
            banned: isBanned,
            banReason: isBanned ? (reason ?? null) : null,
            banExpires: null,
        })
        .where(and(eq(usersTable.id, id), ...visibleUserConditions))
        .returning(adminUserListColumns);

    return updated ?? null;
};

const deleteSessionsByUserId = async (
    executor: Executor,
    userId: string
): Promise<void> => {
    await executor
        .delete(sessionsTable)
        .where(eq(sessionsTable.userId, userId));
};

const insertUserStatusHistory = async (
    executor: Executor,
    values: {
        userId: string;
        oldStatus: UserStatus;
        newStatus: UserStatus;
        changedByUserId: string;
        reason?: string;
    }
): Promise<void> => {
    await executor.insert(userStatusHistoryTable).values({
        userId: values.userId,
        oldStatus: values.oldStatus,
        newStatus: values.newStatus,
        changedByUserId: values.changedByUserId,
        reason: values.reason ?? null,
    });
};

const findActiveRidesByDriverId = async (
    executor: Executor,
    driverId: string
): Promise<{ id: string; rideStatus: RideStatus }[]> => {
    return await executor
        .select({ id: ridesTable.id, rideStatus: ridesTable.rideStatus })
        .from(ridesTable)
        .where(
            and(
                eq(ridesTable.driverId, driverId),
                inArray(ridesTable.rideStatus, ["PLANNED", "IN_PROGRESS"]),
                isNull(ridesTable.deletedAt)
            )
        );
};

const bulkCancelRides = async (
    executor: Executor,
    rideIds: string[]
): Promise<void> => {
    if (rideIds.length === 0) return;
    await executor
        .update(ridesTable)
        .set({ rideStatus: "CANCELLED" })
        .where(inArray(ridesTable.id, rideIds));
};

const bulkInsertRideStatusHistory = async (
    executor: Executor,
    items: {
        rideId: string;
        oldStatus: RideStatus;
        newStatus: RideStatus;
        changedByUserId: string;
        reason: string;
    }[]
): Promise<void> => {
    if (items.length === 0) return;
    await executor.insert(rideStatusHistoryTable).values(items);
};

const findActiveBookingsByPassengerId = async (
    executor: Executor,
    passengerId: string
) => {
    return await executor
        .select({
            id: bookingsTable.id,
            bookingStatus: bookingsTable.bookingStatus,
            rideId: bookingsTable.rideId,
        })
        .from(bookingsTable)
        .where(
            and(
                eq(bookingsTable.passengerId, passengerId),
                inArray(bookingsTable.bookingStatus, ["PENDING", "CONFIRMED"]),
                isNull(bookingsTable.deletedAt)
            )
        );
};

export const AdminUserRepository = {
    findUserList,
    findUserCreatedAt,
    findUserById,
    findUserDetailById,
    findStatusHistoryByUserId,
    updateUserStatus,
    deleteSessionsByUserId,
    insertUserStatusHistory,
    findActiveRidesByDriverId,
    bulkCancelRides,
    bulkInsertRideStatusHistory,
    findActiveBookingsByPassengerId,
};
