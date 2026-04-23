import { UserRepository } from "./user.repository";
import type { OnboardingUserInput, UpdateUserInput } from "./user.types";

const getUserById = async (id: string) => {
    return await UserRepository.findUserById(id);
};

const onboardUser = async (id: string, data: OnboardingUserInput) => {
    return await UserRepository.updateOnboardingInfo(id, data);
};

const updateUserProfile = async (id: string, data: UpdateUserInput) => {
    return await UserRepository.updateUserProfile(id, data);
};

export const UserService = {
    getUserById,
    onboardUser,
    updateUserProfile,
};
