import { assertNever, DomainError } from "./errors";

export const RequestErrorCodes = {
    PayloadTooLarge: "PAYLOAD_TOO_LARGE",
    RateLimited: "RATE_LIMITED",
} as const;

export type RequestErrorCode =
    (typeof RequestErrorCodes)[keyof typeof RequestErrorCodes];

export class RequestError extends DomainError {
    readonly code: RequestErrorCode;
    constructor(code: RequestErrorCode) {
        super(code);
        this.code = code;
    }
}

export class RateLimitError extends RequestError {
    readonly retryAfterSeconds: number;
    constructor(retryAfterSeconds: number) {
        super(RequestErrorCodes.RateLimited);
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

export function requestErrorToHttpStatus(code: RequestErrorCode): number {
    switch (code) {
        case RequestErrorCodes.PayloadTooLarge:
            return 413;
        case RequestErrorCodes.RateLimited:
            return 429;
        default:
            return assertNever(code);
    }
}
