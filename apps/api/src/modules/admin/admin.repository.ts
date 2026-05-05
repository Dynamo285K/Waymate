import {
    aliasedTable,
    and,
    desc,
    eq,
    ilike,
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
} from "@repo/shared";
import type { Executor } from "../../db";
import { users as usersTable } from "../../db/schema/user";
import { userStatusHistory as userStatusHistoryTable } from "../../db/schema/user_status_history";
import type { AdminUserListFilters } from "./admin.types";

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

// Admin tooling manages USER-role accounts only; the seeded admin is
// intentionally invisible/uneditable here. Apply to every query or update
// in this module that touches the users table.
const visibleUserConditions = [
    isNull(usersTable.deletedAt),
    ne(usersTable.userRole, "ADMIN"),
];

const findUserList = async (
    executor: Executor,
    filters: AdminUserListFilters
): Promise<AdminUserListItem[]> => {
    const conditions = [...visibleUserConditions];

    if (filters.search) {
        const pattern = `%${filters.search}%`;
        const searchClause = or(
            ilike(usersTable.email, pattern),
            ilike(usersTable.firstName, pattern),
            ilike(usersTable.lastName, pattern)
        );
        if (searchClause) conditions.push(searchClause);
    }

    if (filters.cursor) {
        const [cursorRow] = await executor
            .select({ createdAt: usersTable.createdAt })
            .from(usersTable)
            .where(eq(usersTable.id, filters.cursor))
            .limit(1);

        // Bogus or invalidated cursor — return an empty page rather than
        // silently restarting from the first row, which would confuse clients.
        if (!cursorRow) return [];

        const cursorClause = or(
            lt(usersTable.createdAt, cursorRow.createdAt),
            and(
                eq(usersTable.createdAt, cursorRow.createdAt),
                lt(usersTable.id, filters.cursor)
            )
        );
        if (cursorClause) conditions.push(cursorClause);
    }

    return await executor
        .select(adminUserListColumns)
        .from(usersTable)
        .where(and(...conditions))
        .orderBy(desc(usersTable.createdAt), desc(usersTable.id))
        .limit(filters.limit);
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
    // Alias users for the LEFT JOIN so the actor's name comes back even though
    // the same table is implicitly the subject in user_status_history.
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
    status: UserStatus
): Promise<AdminUserListItem | null> => {
    const [updated] = await executor
        .update(usersTable)
        .set({ userStatus: status, updatedAt: new Date() })
        .where(and(eq(usersTable.id, id), ...visibleUserConditions))
        .returning(adminUserListColumns);

    return updated ?? null;
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

export const AdminRepository = {
    findUserList,
    findUserById,
    findUserDetailById,
    findStatusHistoryByUserId,
    updateUserStatus,
    insertUserStatusHistory,
};
