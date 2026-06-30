import { DomainError } from "./errors";

export const RequestErrorCodes = {
    PayloadTooLarge: "PAYLOAD_TOO_LARGE",
    RateLimited: "RATE_LIMITED",
} as const;

export type RequestErrorCode =
    (typeof RequestErrorCodes)[keyof typeof RequestErrorCodes];

const REQUEST_ERROR_STATUS: Record<RequestErrorCode, number> = {
    [RequestErrorCodes.PayloadTooLarge]: 413,
    [RequestErrorCodes.RateLimited]: 429,
};

export class RequestError extends DomainError {
    readonly code: RequestErrorCode;
    constructor(code: RequestErrorCode) {
        super(code, REQUEST_ERROR_STATUS[code]);
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
