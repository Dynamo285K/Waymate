import { UserRepository } from "./user.repository";
import type { OnboardingUserBody, UpdateUserBody } from "./user.types";

const getUserById = async (id: string) => {
    return await UserRepository.findUserById(id);
};

const onboardUser = async (id: string, data: OnboardingUserBody) => {
    return await UserRepository.updateOnboardingInfo(id, data);
};

const updateUserProfile = async (id: string, data: UpdateUserBody) => {
    return await UserRepository.updateUserProfile(id, data);
};

export const UserService = {
    getUserById,
    onboardUser,
    updateUserProfile,
};
