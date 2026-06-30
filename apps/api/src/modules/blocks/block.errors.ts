import { DomainError } from "../../shared/errors";

export const BlockErrorCodes = {
    CannotBlockSelf: "BLOCK_CANNOT_BLOCK_SELF",
    TargetNotFound: "BLOCK_TARGET_NOT_FOUND",
    NotBlocked: "BLOCK_NOT_BLOCKED",
} as const;

export type BlockErrorCode =
    (typeof BlockErrorCodes)[keyof typeof BlockErrorCodes];

const BLOCK_ERROR_STATUS: Record<BlockErrorCode, number> = {
    [BlockErrorCodes.CannotBlockSelf]: 400,
    [BlockErrorCodes.TargetNotFound]: 404,
    [BlockErrorCodes.NotBlocked]: 404,
};

export class BlockError extends DomainError {
    readonly code: BlockErrorCode;
    constructor(code: BlockErrorCode) {
        super(code, BLOCK_ERROR_STATUS[code]);
        this.code = code;
    }
}
