import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users as usersTable } from "../../db/schema/user";
import type { User, OnboardingUserInput, UpdateUserInput } from "./user.types";

const findUserById = async (id: string): Promise<User | undefined> => {
    return await db.query.users.findFirst({
        where: eq(usersTable.id, id),
    });
};

const updateOnboardingInfo = async (
    userId: string,
    data: OnboardingUserInput
): Promise<User | null> => {
    const [updatedUser] = await db
        .update(usersTable)
        .set(data)
        .where(eq(usersTable.id, userId))
        .returning();

    return updatedUser ?? null;
};

const updateUserProfile = async (
    userId: string,
    data: UpdateUserInput
): Promise<User | null> => {
    const [updatedUser] = await db
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
