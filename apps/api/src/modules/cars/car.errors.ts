import { DomainError } from "../../shared/errors";

export const CarErrorCodes = {
    ModelNotFound: "CAR_MODEL_NOT_FOUND",
    DuplicatePlate: "CAR_DUPLICATE_PLATE",
    CarNotFound: "CAR_NOT_FOUND",
    CarInUse: "CAR_IN_USE",
} as const;

export type CarErrorCode = (typeof CarErrorCodes)[keyof typeof CarErrorCodes];

const CAR_ERROR_STATUS: Record<CarErrorCode, number> = {
    [CarErrorCodes.ModelNotFound]: 400,
    [CarErrorCodes.DuplicatePlate]: 409,
    [CarErrorCodes.CarNotFound]: 404,
    [CarErrorCodes.CarInUse]: 409,
};

export class CarError extends DomainError {
    readonly code: CarErrorCode;
    constructor(code: CarErrorCode) {
        super(code, CAR_ERROR_STATUS[code]);
        this.code = code;
    }
}
