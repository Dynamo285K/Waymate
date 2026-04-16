import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users as usersTable } from "../../db/schema/user";
import type { User, OnboardingUserBody, UpdateUserBody } from "./user.types";

const findUserById = async (id: string) => {
    const rows = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id));
    return rows[0] as User | undefined;
};

const updateOnboardingInfo = async (
    userId: string,
    data: OnboardingUserBody
): Promise<User> => {
    const [updatedUser] = await db
        .update(usersTable)
        .set({
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            bio: data.bio,
        })
        .where(eq(usersTable.id, userId))
        .returning();

    return updatedUser as User;
};

const updateUserProfile = async (
    userId: string,
    data: UpdateUserBody
): Promise<User> => {
    const [updatedUser] = await db
        .update(usersTable)
        .set(data)
        .where(eq(usersTable.id, userId))
        .returning();

    return updatedUser as User;
};

export const UserRepository = {
    findUserById,
    updateOnboardingInfo,
    updateUserProfile,
};
