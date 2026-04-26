export const PostgresErrorCodes = {
    UniqueViolation: "23505",
    ForeignKeyViolation: "23503",
} as const;

export type PostgresErrorCode =
    (typeof PostgresErrorCodes)[keyof typeof PostgresErrorCodes];

const isPostgresError = (error: unknown): error is Error & { code: string } =>
    error instanceof Error &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string";

export const hasPostgresErrorCode = (
    error: unknown,
    code: PostgresErrorCode
): boolean => isPostgresError(error) && error.code === code;
