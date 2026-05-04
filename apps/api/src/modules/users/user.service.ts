import { db } from "../../db";
import { UserRepository } from "./user.repository";
import { UserError, UserErrorCodes } from "./user.errors";
import type { User, OnboardingUserInput, UpdateUserInput } from "./user.types";

// The better-auth admin plugin owns ban-related columns. They aren't part of
// our public user shape (UserEntitySchema) and would otherwise leak through
// /users/me responses.
const stripAdminPluginFields = (user: User) => {
    const {
        banned: _banned,
        banReason: _banReason,
        banExpires: _banExpires,
        ...rest
    } = user;
    return rest;
};

const getUserById = async (id: string): Promise<User> => {
    const user = await UserRepository.findUserById(db, id);
    if (!user) throw new UserError(UserErrorCodes.UserNotFound);
    return stripAdminPluginFields(user) as User;
};

const onboardUser = async (
    id: string,
    data: OnboardingUserInput
): Promise<User> => {
    const updated = await UserRepository.updateOnboardingInfo(db, id, data);
    if (!updated) throw new UserError(UserErrorCodes.UserNotFound);
    return stripAdminPluginFields(updated) as User;
};

const updateUserProfile = async (
    id: string,
    data: UpdateUserInput
): Promise<User> => {
    const updated = await UserRepository.updateUserProfile(db, id, data);
    if (!updated) throw new UserError(UserErrorCodes.UserNotFound);
    return stripAdminPluginFields(updated) as User;
};

export const UserService = {
    getUserById,
    onboardUser,
    updateUserProfile,
};
