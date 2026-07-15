export type PopularRouteChipProps = {
    from: string;
    to: string;
    count: number;
    onClick?: () => void;
};

export function PopularRouteChip({
    from,
    to,
    count,
    onClick,
}: PopularRouteChipProps) {
    return (
        <button
            type="button"
            className="inline-flex items-center gap-2.5 py-2 px-4 bg-card border border-border rounded-full cursor-pointer transition-[background-color,border-color] duration-150 hover:bg-secondary-hover hover:border-primary"
            onClick={onClick}
        >
            <span className="text-control font-medium text-text-primary whitespace-nowrap">
                {from} → {to}
            </span>
            <span className="text-caption text-text-secondary">{count}</span>
        </button>
    );
}
