import { assertNever, DomainError } from "../../shared/errors";

export const BlockErrorCodes = {
    CannotBlockSelf: "BLOCK_CANNOT_BLOCK_SELF",
    TargetNotFound: "BLOCK_TARGET_NOT_FOUND",
    NotBlocked: "BLOCK_NOT_BLOCKED",
} as const;

export type BlockErrorCode =
    (typeof BlockErrorCodes)[keyof typeof BlockErrorCodes];

export class BlockError extends DomainError {
    readonly code: BlockErrorCode;
    constructor(code: BlockErrorCode) {
        super(code);
        this.code = code;
    }
}

export function blockErrorToHttpStatus(code: BlockErrorCode): number {
    switch (code) {
        case BlockErrorCodes.CannotBlockSelf:
            return 400;
        case BlockErrorCodes.TargetNotFound:
        case BlockErrorCodes.NotBlocked:
            return 404;
        default:
            return assertNever(code);
    }
}
