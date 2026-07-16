export type DividerProps = {
    label?: string;
};

export function Divider({ label }: DividerProps) {
    return (
        <div className="flex items-center w-full gap-3">
            <span className="flex-1 h-px bg-border" />
            {label && (
                <span className="text-sm text-text-secondary whitespace-nowrap">
                    {label}
                </span>
            )}
            <span className="flex-1 h-px bg-border" />
        </div>
    );
}
