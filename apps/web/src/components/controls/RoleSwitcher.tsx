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
    size?: "md" | "sm";
};

const itemBase =
    "min-w-role-switcher-min py-role-switcher-y px-role-switcher-x rounded-full text-sm font-medium leading-none cursor-pointer transition-all duration-200 border-0 -ml-1.5 first:ml-0";
const itemSmall =
    "min-w-20 py-2 px-3 rounded-full text-xs font-semibold leading-none cursor-pointer transition-all duration-200 border-0 -ml-1 first:ml-0";
const itemInactive = "bg-transparent text-text-secondary";
const itemActive = "bg-primary text-white shadow-primary-sm relative z-raised";

export function RoleSwitcher({
    value,
    onChange,
    labels,
    className,
    size = "md",
}: RoleSwitcherProps) {
    const baseClass = size === "sm" ? itemSmall : itemBase;

    return (
        <div
            className={`inline-flex items-center rounded-full bg-card border border-border shadow-button ${size === "sm" ? "p-0.75" : "p-1"}${className ? ` ${className}` : ""}`}
            role="tablist"
            aria-label="Role switcher"
        >
            <Button
                variant="unstyled"
                role="tab"
                aria-selected={value === "passenger"}
                className={`${baseClass} ${value === "passenger" ? itemActive : itemInactive}`}
                onClick={() => onChange("passenger")}
            >
                {labels?.passenger ?? "Passenger"}
            </Button>
            <Button
                variant="unstyled"
                role="tab"
                aria-selected={value === "driver"}
                className={`${baseClass} ${value === "driver" ? itemActive : itemInactive}`}
                onClick={() => onChange("driver")}
            >
                {labels?.driver ?? "Driver"}
            </Button>
        </div>
    );
}
