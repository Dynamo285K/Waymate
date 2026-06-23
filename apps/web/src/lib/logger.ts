/**
 * Thin client-side logger. Today it only wraps `console`, but routing every
 * browser-side log through this single choke point means we can later forward
 * errors to a telemetry sink (Sentry, LogRocket, …) without touching call
 * sites. Prefer this over calling `console.*` directly in app code.
 */
function emit(
    level: "error" | "warn" | "info",
    message: string,
    cause?: unknown
): void {
    if (cause === undefined) {
        console[level](message);
    } else {
        console[level](message, cause);
    }
}

export const logger = {
    error: (message: string, cause?: unknown) => emit("error", message, cause),
    warn: (message: string, cause?: unknown) => emit("warn", message, cause),
    info: (message: string, cause?: unknown) => emit("info", message, cause),
};
