import { and, desc, eq, ilike, isNull, lt, or } from "drizzle-orm";
import type { AdminUserListItem, UserRole } from "@repo/shared";
import type { Executor } from "../../db";
import { users as usersTable } from "../../db/schema/user";
import type { AdminUserListFilters } from "./admin.types";

const adminUserListColumns = {
    id: usersTable.id,
    email: usersTable.email,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    role: usersTable.role,
    userStatus: usersTable.userStatus,
    createdAt: usersTable.createdAt,
    lastActiveAt: usersTable.lastActiveAt,
} as const;

const findUserList = async (
    executor: Executor,
    filters: AdminUserListFilters
): Promise<AdminUserListItem[]> => {
    const conditions = [isNull(usersTable.deletedAt)];

    if (filters.role) {
        conditions.push(eq(usersTable.role, filters.role));
    }

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
        .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
        .limit(1);

    return user ?? null;
};

const updateUserRole = async (
    executor: Executor,
    id: string,
    role: UserRole
): Promise<AdminUserListItem | null> => {
    const [updated] = await executor
        .update(usersTable)
        .set({ role, updatedAt: new Date() })
        .where(and(eq(usersTable.id, id), isNull(usersTable.deletedAt)))
        .returning(adminUserListColumns);

    return updated ?? null;
};

export const AdminRepository = {
    findUserList,
    findUserById,
    updateUserRole,
};
