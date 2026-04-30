export const AdminErrors = {
    UserNotFound: "ADMIN_USER_NOT_FOUND",
    CannotDemoteSelf: "ADMIN_CANNOT_DEMOTE_SELF",
} as const;

export type AdminErrorCode = (typeof AdminErrors)[keyof typeof AdminErrors];
