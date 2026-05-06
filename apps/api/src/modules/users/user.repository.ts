import { and, eq, isNull } from "drizzle-orm";
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

export const UserRepository = {
    findUserById,
    updateOnboardingInfo,
    updateUserProfile,
};
