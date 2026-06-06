import { Button } from "@waymate/ui";

export type Role = "passenger" | "driver";

export type RoleSwitcherLabels = {
    passenger?: string;
    driver?: string;
};

export type RoleSwitcherProps = {
    value: Role;
    onChange: (value: Role) => void;
    labels?: RoleSwitcherLabels;
    className?: string;
};

const itemBase =
    "min-w-[120px] py-[10px] px-[18px] rounded-full bg-transparent text-(--color-text-secondary) text-sm font-medium leading-none cursor-pointer transition-all duration-200 border-0 -ml-1.5 first:ml-0";
const itemActive =
    "bg-(--color-primary) text-(--color-secondary) shadow-[0_2px_8px_rgba(17,173,50,0.25)] relative z-[1]";

export function RoleSwitcher({ value, onChange, labels, className }: RoleSwitcherProps) {
    return (
        <div
            className={`inline-flex items-center p-1 rounded-full bg-(--color-card) border border-(--color-border) shadow-[0_2px_6px_rgba(0,0,0,0.12)]${className ? ` ${className}` : ""}`}
            role="tablist"
            aria-label="Role switcher"
        >
            <Button
                variant="unstyled"
                role="tab"
                aria-selected={value === "passenger"}
                className={`${itemBase} ${value === "passenger" ? itemActive : ""}`}
                onClick={() => onChange("passenger")}
            >
                {labels?.passenger ?? "Passenger"}
            </Button>
            <Button
                variant="unstyled"
                role="tab"
                aria-selected={value === "driver"}
                className={`${itemBase} ${value === "driver" ? itemActive : ""}`}
                onClick={() => onChange("driver")}
            >
                {labels?.driver ?? "Driver"}
            </Button>
        </div>
    );
}
