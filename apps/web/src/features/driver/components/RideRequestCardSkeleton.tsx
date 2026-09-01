export function RideRequestCardSkeleton() {
    return (
        <div className="flex min-w-0 items-center justify-between gap-6 py-5 px-6 bg-card border border-border rounded-2xl max-sm:flex-wrap max-sm:gap-3 max-sm:p-4 animate-pulse">
            <div className="flex items-center gap-4 shrink-0 max-sm:flex-1 max-sm:min-w-0">
                <div className="w-12 h-12 rounded-full bg-border" />
                <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 rounded bg-border" />
                    <div className="h-3 w-16 rounded bg-border" />
                    <div className="h-3 w-24 rounded bg-border" />
                </div>
            </div>
            <div className="flex flex-col flex-1 max-sm:w-full max-sm:flex-none gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-border shrink-0" />
                    <div className="h-4 w-32 rounded bg-border" />
                </div>
                <div className="w-0.5 h-4 bg-border ml-1.25" />
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-border shrink-0" />
                    <div className="h-4 w-40 rounded bg-border" />
                </div>
                <div className="h-3 w-32 rounded bg-border mt-1" />
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0 max-sm:w-full max-sm:min-w-0">
                <div className="h-6 w-16 rounded bg-border max-sm:self-end" />
                <div className="flex gap-2 max-sm:grid max-sm:w-full max-sm:grid-cols-2">
                    <div className="h-10 w-28 rounded-lg bg-border max-sm:w-full" />
                    <div className="h-10 w-28 rounded-lg bg-border max-sm:w-full" />
                </div>
            </div>
        </div>
    );
}

export function RideRequestCardSkeletonGrid({ count = 2 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <RideRequestCardSkeleton key={i} />
            ))}
        </>
    );
}
