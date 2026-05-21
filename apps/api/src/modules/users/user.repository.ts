import { and, eq, isNull, lt, or } from "drizzle-orm";
import type { Executor } from "../../db";
import { users as usersTable } from "../../db/schema/user";
import type { User, OnboardingUserInput, UpdateUserInput } from "./user.types";

const userNotSoftDeleted = isNull(usersTable.deletedAt);

const findUserById = async (
    executor: Executor,
    id: string
): Promise<User | undefined> => {
    return await executor.query.users.findFirst({
        where: and(eq(usersTable.id, id), userNotSoftDeleted),
    });
};

const updateOnboardingInfo = async (
    executor: Executor,
    userId: string,
    data: OnboardingUserInput
): Promise<User | null> => {
    const [updatedUser] = await executor
        .update(usersTable)
        .set(data)
        .where(and(eq(usersTable.id, userId), userNotSoftDeleted))
        .returning();

    return updatedUser ?? null;
};

const updateUserProfile = async (
    executor: Executor,
    userId: string,
    data: UpdateUserInput
): Promise<User | null> => {
    const [updatedUser] = await executor
        .update(usersTable)
        .set(data)
        .where(and(eq(usersTable.id, userId), userNotSoftDeleted))
        .returning();

    return updatedUser ?? null;
};

// Bumps last_active_at to `now`, but only when it is unset or already older
// than `thresholdMs` — a single conditional UPDATE, so concurrent requests
// cannot race a read-then-write and a busy user is written at most once per
// window. This also bumps users.updated_at via the set_updated_at_to_now
// trigger, which is acceptable: the row genuinely changed.
const touchLastActiveAt = async (
    executor: Executor,
    userId: string,
    now: Date,
    thresholdMs: number
): Promise<void> => {
    const staleBefore = new Date(now.getTime() - thresholdMs);
    await executor
        .update(usersTable)
        .set({ lastActiveAt: now })
        .where(
            and(
                eq(usersTable.id, userId),
                userNotSoftDeleted,
                or(
                    isNull(usersTable.lastActiveAt),
                    lt(usersTable.lastActiveAt, staleBefore)
                )
            )
        );
};

export const UserRepository = {
    findUserById,
    updateOnboardingInfo,
    updateUserProfile,
    touchLastActiveAt,
};
