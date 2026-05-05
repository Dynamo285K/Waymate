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

/**
 * Runs `fn` and translates known Postgres SQLSTATE codes into domain errors
 * via the supplied `mapping`. Each mapping handler MUST throw — its return
 * type is `never` — so a successful call short-circuits before reaching the
 * final `throw error` and the original error is rethrown unchanged when no
 * mapping matches.
 *
 * Example:
 *   return mapPostgresErrors(
 *       () => CarRepository.insertCar(db, userId, data),
 *       {
 *           [PostgresErrorCodes.ForeignKeyViolation]: () => {
 *               throw new CarError(CarErrorCodes.ModelNotFound);
 *           },
 *           [PostgresErrorCodes.UniqueViolation]: () => {
 *               throw new CarError(CarErrorCodes.DuplicatePlate);
 *           },
 *       }
 *   );
 */
export async function mapPostgresErrors<T>(
    fn: () => Promise<T>,
    mapping: Partial<Record<PostgresErrorCode, () => never>>
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        for (const [code, throwHandler] of Object.entries(mapping)) {
            if (hasPostgresErrorCode(error, code as PostgresErrorCode)) {
                throwHandler!();
            }
        }
        throw error;
    }
}
