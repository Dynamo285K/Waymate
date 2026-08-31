import type { ErrorComponentProps } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AlertIcon } from "@/components/ui/icons/AlertIcon";
import { Button } from "@/components/ui/Button";

// Last-resort fallback rendered by TanStack Router when a route component or
// loader throws. Without it, a single render-time error (e.g. an undefined
// reference in one page) white-screens the entire app — there is no other
// error boundary above the router. `reset` retries the route render, which
// recovers transient failures (a failed loader fetch); a hard reload is the
// escape hatch for anything deterministic.
//
// Because this is the last-resort boundary, i18n uses inline English fallbacks
// via the `t(key, defaultValue)` overload so that if the i18n system itself is
// broken, the user still sees readable text instead of raw translation keys.
export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
                <div className="inline-flex justify-center text-danger-text">
                    <AlertIcon />
                </div>
                <h1 className="mt-4 text-xl font-bold text-text-primary">
                    {t("errorBoundary.title", "Something went wrong")}
                </h1>
                <p className="mt-2 text-sm text-text-secondary">
                    {t(
                        "errorBoundary.description",
                        "This page failed to load. Try again — if the problem persists, reload the app."
                    )}
                </p>
                {import.meta.env.DEV && (
                    <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-background p-3 text-left text-xs text-danger-text">
                        {error instanceof Error
                            ? (error.stack ?? error.message)
                            : String(error)}
                    </pre>
                )}
                <div className="mt-6 flex justify-center gap-3">
                    <Button
                        type="button"
                        onClick={reset}
                        variant="outline"
                    >
                        {t("errorBoundary.tryAgain", "Try again")}
                    </Button>
                    <Button
                        type="button"
                        onClick={() => window.location.assign("/")}
                        variant="primary"
                    >
                        {t("errorBoundary.goHome", "Go home")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

