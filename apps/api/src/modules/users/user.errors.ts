export const UserErrors = {
    UserNotFound: "USER_NOT_FOUND",
} as const;

export type UserErrorCode = (typeof UserErrors)[keyof typeof UserErrors];
