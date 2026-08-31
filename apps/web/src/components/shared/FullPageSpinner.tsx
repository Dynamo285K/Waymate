// Centered spinner used as the Suspense fallback during route-level
// code-splitting lazy loads. Replaces the previous empty div so the user sees
// visual activity instead of a blank screen.

export function FullPageSpinner() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div
                className="w-8 h-8 rounded-full border-3 border-border border-t-primary animate-spin"
                role="status"
                aria-label="Loading"
            />
        </div>
    );
}
