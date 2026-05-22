import { assertNever, DomainError } from "../../shared/errors";

export const CarErrorCodes = {
    ModelNotFound: "CAR_MODEL_NOT_FOUND",
    DuplicatePlate: "CAR_DUPLICATE_PLATE",
    CarNotFound: "CAR_NOT_FOUND",
    CarInUse: "CAR_IN_USE",
} as const;

export type CarErrorCode = (typeof CarErrorCodes)[keyof typeof CarErrorCodes];

export class CarError extends DomainError {
    readonly code: CarErrorCode;
    constructor(code: CarErrorCode) {
        super(code);
        this.code = code;
    }
}

export function carErrorToHttpStatus(code: CarErrorCode): number {
    switch (code) {
        case CarErrorCodes.CarNotFound:
            return 404;
        case CarErrorCodes.DuplicatePlate:
        case CarErrorCodes.CarInUse:
            return 409;
        case CarErrorCodes.ModelNotFound:
            return 400;
        default:
            return assertNever(code);
    }
}
