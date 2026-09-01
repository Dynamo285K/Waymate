export function CarCardSkeleton() {
    return (
        <div className="w-full min-h-20 py-4 px-[18px] border-0 rounded-2xl bg-card shadow-card flex items-center gap-4 animate-pulse box-border">
            <div className="w-14 h-14 rounded-xl bg-border shrink-0" />
            <div className="flex-1">
                <div className="h-5 w-32 rounded bg-border" />
            </div>
            <div className="w-9 h-9 rounded-lg bg-border shrink-0" />
        </div>
    );
}

export function CarCardSkeletonGrid({ count = 1 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <CarCardSkeleton key={i} />
            ))}
        </>
    );
}
