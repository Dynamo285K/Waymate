export const AdminErrors = {
    UserNotFound: "ADMIN_USER_NOT_FOUND",
    CannotDemoteSelf: "ADMIN_CANNOT_DEMOTE_SELF",
    CannotChangeOwnStatus: "ADMIN_CANNOT_CHANGE_OWN_STATUS",
} as const;

export type AdminErrorCode = (typeof AdminErrors)[keyof typeof AdminErrors];
