/**
 * Base class every module-level domain error extends. Lets routes discriminate
 * domain failures from infrastructure failures via `instanceof DomainError`
 * rather than fragile `error.message ===` checks.
 *
 * Each error carries its own `httpStatus`, so the single root `.onError` maps
 * any domain error with `status(error.httpStatus, { error: error.code })` —
 * no per-module handler or status-mapping function. Subclasses set `httpStatus`
 * from a `Record<XErrorCode, number>`, which the compiler forces to cover every
 * code (a missing key is a type error).
 */
export abstract class DomainError extends Error {
    abstract readonly code: string;

    constructor(
        code: string,
        readonly httpStatus: number
    ) {
        super(code);
        this.name = this.constructor.name;
    }
}
