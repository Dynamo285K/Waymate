// Shimmer placeholder matching the dimensions of AvailableRideCard / RideCard.
// Renders Tailwind `animate-pulse` bars that mirror the real card layout
// (route line, meta rows, driver/avatar, price, button) so the transition from
// loading to loaded is smooth with no layout shift.

export function RideCardSkeleton() {
    return (
        <div className="flex items-center justify-between gap-6 px-6 py-4 bg-card border border-border rounded-2xl animate-pulse max-600:items-start max-600:gap-4 max-600:px-5">
            {/* Left: route + meta */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* Route text */}
                <div className="h-5 w-48 rounded bg-border" />
                {/* Meta rows */}
                <div className="flex flex-col gap-1.5">
                    <div className="h-3.5 w-36 rounded bg-border" />
                    <div className="h-3.5 w-28 rounded bg-border" />
                    <div className="h-3.5 w-24 rounded bg-border" />
                </div>
            </div>

            {/* Right: driver + price + button */}
            <div className="flex shrink-0 items-center gap-10 max-600:flex-col max-600:items-end max-600:gap-5">
                {/* Avatar + name */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-border" />
                    <div className="flex flex-col gap-1">
                        <div className="h-3.5 w-20 rounded bg-border" />
                        <div className="h-3 w-12 rounded bg-border" />
                    </div>
                </div>
                {/* Price + button */}
                <div className="flex items-center gap-4">
                    <div className="h-5 w-10 rounded bg-border" />
                    <div className="h-9 w-16 rounded-lg bg-border" />
                </div>
            </div>
        </div>
    );
}

/** Grid of 3 skeleton cards — drop-in replacement for the loading text. */
export function RideCardSkeletonGrid({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-3">
            {Array.from({ length: count }, (_, i) => (
                <RideCardSkeleton key={i} />
            ))}
        </div>
    );
}
