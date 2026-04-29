import { db } from "../../db";
import { UserRepository } from "./user.repository";
import type { User, OnboardingUserInput, UpdateUserInput } from "./user.types";

const getUserById = async (id: string): Promise<User | undefined> => {
    return await UserRepository.findUserById(db, id);
};

const onboardUser = async (
    id: string,
    data: OnboardingUserInput
): Promise<User | null> => {
    return await UserRepository.updateOnboardingInfo(db, id, data);
};

const updateUserProfile = async (
    id: string,
    data: UpdateUserInput
): Promise<User | null> => {
    return await UserRepository.updateUserProfile(db, id, data);
};

export const UserService = {
    getUserById,
    onboardUser,
    updateUserProfile,
};
