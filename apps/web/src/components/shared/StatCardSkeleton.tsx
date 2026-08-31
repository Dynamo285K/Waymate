// Shimmer placeholder matching the StatCard layout (icon box + value + label).
// Used in HomeStatsSection while data loads.

export function StatCardSkeleton() {
    return (
        <div className="flex items-center gap-4 py-5 px-6 bg-card border border-border rounded-2xl animate-pulse">
            {/* Icon placeholder */}
            <div className="w-12 h-12 rounded-xl bg-border shrink-0" />
            {/* Text lines */}
            <div className="flex flex-col gap-1.5">
                <div className="h-5 w-20 rounded bg-border" />
                <div className="h-3.5 w-28 rounded bg-border" />
            </div>
        </div>
    );
}

/** Grid of 3 stat card skeletons matching the HomeStatsSection grid layout. */
export function StatCardSkeletonGrid({ count = 3 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: count }, (_, i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>
    );
}
