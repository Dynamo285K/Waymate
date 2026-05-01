/**
 * Base class every module-level domain error extends. Lets routes discriminate
 * domain failures from infrastructure failures via `instanceof DomainError`
 * (or its concrete subclass) rather than fragile `error.message ===` checks.
 *
 * Subclasses MUST declare a `code` field whose type is the module's
 * code-literal union, so the `default` branch of an exhaustive switch falls
 * through to `assertNever` and the compiler enforces full coverage.
 */
export abstract class DomainError extends Error {
    abstract readonly code: string;

    constructor(code: string) {
        super(code);
        this.name = this.constructor.name;
    }
}

/**
 * Compile-time exhaustiveness assertion. Call from the `default` branch of a
 * `switch (error.code)` over a literal-union code type to force the compiler
 * to error if a new code is added without a matching case.
 */
export function assertNever(value: never): never {
    throw new Error(`Unhandled value: ${String(value)}`);
}
