import { eq } from "drizzle-orm";
import type { Executor } from "../../db";
import { users as usersTable } from "../../db/schema/user";
import type { User, OnboardingUserInput, UpdateUserInput } from "./user.types";

const findUserById = async (
    executor: Executor,
    id: string
): Promise<User | undefined> => {
    return await executor.query.users.findFirst({
        where: eq(usersTable.id, id),
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
        .where(eq(usersTable.id, userId))
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
        .where(eq(usersTable.id, userId))
        .returning();

    return updatedUser ?? null;
};

export const UserRepository = {
    findUserById,
    updateOnboardingInfo,
    updateUserProfile,
};
