export const UserErrors = {
    UserNotFound: "USER_NOT_FOUND",
    UnauthorizedAction: "USER_UNAUTHORIZED_ACTION",
    InvalidProfileData: "USER_INVALID_PROFILE_DATA",
    AlreadyOnboarded: "USER_ALREADY_ONBOARDED",
} as const;

export type UserErrorCode = (typeof UserErrors)[keyof typeof UserErrors];
