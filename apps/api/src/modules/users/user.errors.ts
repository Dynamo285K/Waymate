import { DomainError } from "../../shared/errors";

export const UserErrorCodes = {
    UserNotFound: "USER_NOT_FOUND",
} as const;

export type UserErrorCode =
    (typeof UserErrorCodes)[keyof typeof UserErrorCodes];

const USER_ERROR_STATUS: Record<UserErrorCode, number> = {
    [UserErrorCodes.UserNotFound]: 404,
};

export class UserError extends DomainError {
    readonly code: UserErrorCode;
    constructor(code: UserErrorCode) {
        super(code, USER_ERROR_STATUS[code]);
        this.code = code;
    }
}
