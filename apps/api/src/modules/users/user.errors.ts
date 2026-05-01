import { assertNever, DomainError } from "../../shared/errors";

export const UserErrorCodes = {
    UserNotFound: "USER_NOT_FOUND",
} as const;

export type UserErrorCode =
    (typeof UserErrorCodes)[keyof typeof UserErrorCodes];

export class UserError extends DomainError {
    readonly code: UserErrorCode;
    constructor(code: UserErrorCode) {
        super(code);
        this.code = code;
    }
}

export function userErrorToHttpStatus(code: UserErrorCode): number {
    switch (code) {
        case UserErrorCodes.UserNotFound:
            return 404;
        default:
            return assertNever(code);
    }
}
