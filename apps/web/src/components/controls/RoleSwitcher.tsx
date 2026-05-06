import "./RoleSwitcher.css";

export type Role = "passenger" | "driver";

export type RoleSwitcherLabels = {
    passenger?: string;
    driver?: string;
};

export type RoleSwitcherProps = {
    value: Role;
    onChange: (value: Role) => void;
    labels?: RoleSwitcherLabels;
};

export function RoleSwitcher({ value, onChange, labels }: RoleSwitcherProps) {
    return (
        <div
            className="role-switcher"
            role="tablist"
            aria-label="Role switcher"
        >
            <button
                type="button"
                role="tab"
                aria-selected={value === "passenger"}
                className={`role-switcher__item ${
                    value === "passenger" ? "role-switcher__item--active" : ""
                }`}
                onClick={() => onChange("passenger")}
            >
                {labels?.passenger ?? "Passenger"}
            </button>

            <button
                type="button"
                role="tab"
                aria-selected={value === "driver"}
                className={`role-switcher__item ${
                    value === "driver" ? "role-switcher__item--active" : ""
                }`}
                onClick={() => onChange("driver")}
            >
                {labels?.driver ?? "Driver"}
            </button>
        </div>
    );
}
