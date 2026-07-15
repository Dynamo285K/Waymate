export type SegmentedOption = {
    label: string;
    value: string;
};

export type SegmentedControlProps = {
    options: SegmentedOption[];
    value: string;
    onChange: (value: string) => void;
    role?: "tabs" | "group";
    size?: "md" | "sm";
    className?: string;
};

export function SegmentedControl({
    options,
    value,
    onChange,
    role = "group",
    size = "md",
    className,
}: SegmentedControlProps) {
    const isSmall = size === "sm";

    return (
        <div
            className={`inline-flex items-center gap-1 border border-border rounded-full bg-background shadow-control ${isSmall ? "p-1" : "p-2.5"}${className ? ` ${className}` : ""}`}
            role={role === "tabs" ? "tablist" : "group"}
        >
            {options.map((option) => {
                const isActive = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role={role === "tabs" ? "tab" : undefined}
                        aria-selected={role === "tabs" ? isActive : undefined}
                        aria-pressed={role === "group" ? isActive : undefined}
                        className={`border-0 rounded-full cursor-pointer leading-none ${
                            isSmall
                                ? "py-2 px-3 text-xs font-semibold"
                                : "py-2.5 px-4.5 text-sm"
                        } ${
                            isActive
                                ? "bg-card text-text-primary shadow-control"
                                : "bg-transparent text-text-secondary"
                        }`}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
