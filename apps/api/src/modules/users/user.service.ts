import { db } from "../../db";
import { UserRepository } from "./user.repository";
import { UserError, UserErrorCodes } from "./user.errors";
import type { User, OnboardingUserInput, UpdateUserInput } from "./user.types";

const getUserById = async (id: string): Promise<User> => {
    const user = await UserRepository.findUserById(db, id);
    if (!user) throw new UserError(UserErrorCodes.UserNotFound);
    return user;
};

const onboardUser = async (
    id: string,
    data: OnboardingUserInput
): Promise<User> => {
    const updated = await UserRepository.updateOnboardingInfo(db, id, data);
    if (!updated) throw new UserError(UserErrorCodes.UserNotFound);
    return updated;
};

const updateUserProfile = async (
    id: string,
    data: UpdateUserInput
): Promise<User> => {
    const updated = await UserRepository.updateUserProfile(db, id, data);
    if (!updated) throw new UserError(UserErrorCodes.UserNotFound);
    return updated;
};

export const UserService = {
    getUserById,
    onboardUser,
    updateUserProfile,
};
