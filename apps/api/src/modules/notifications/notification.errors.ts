import { DomainError } from "../../shared/errors";

export const NotificationErrorCodes = {
    NotFound: "NOTIFICATION_NOT_FOUND",
} as const;

export type NotificationErrorCode =
    (typeof NotificationErrorCodes)[keyof typeof NotificationErrorCodes];

const NOTIFICATION_ERROR_STATUS: Record<NotificationErrorCode, number> = {
    [NotificationErrorCodes.NotFound]: 404,
};

export class NotificationError extends DomainError {
    readonly code: NotificationErrorCode;
    constructor(code: NotificationErrorCode) {
        super(code, NOTIFICATION_ERROR_STATUS[code]);
        this.code = code;
    }
}
