export const CarErrors = {
    ModelNotFound: "CAR_MODEL_NOT_FOUND",
    DuplicatePlate: "CAR_DUPLICATE_PLATE",
    CarNotFound: "CAR_NOT_FOUND",
} as const;

export type CarErrorCode = (typeof CarErrors)[keyof typeof CarErrors];
