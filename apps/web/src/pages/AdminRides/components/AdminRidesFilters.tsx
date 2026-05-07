import { useTranslation } from "react-i18next";
import type { RideStatus } from "../../../api-client/model/rideStatus";

type StatusFilter = "ALL" | RideStatus;

type AdminRidesFiltersProps = {
    statusFilter: StatusFilter;
    onStatusFilterChange: (value: StatusFilter) => void;
    searchInput: string;
    onSearchInputChange: (value: string) => void;
};

const STATUS_FILTERS: ReadonlyArray<{ key: StatusFilter; labelKey: string }> = [
    { key: "ALL", labelKey: "admin.all" },
    { key: "PLANNED", labelKey: "admin.planned" },
    { key: "IN_PROGRESS", labelKey: "admin.inProgress" },
    { key: "COMPLETED", labelKey: "admin.completed" },
    { key: "CANCELLED", labelKey: "admin.cancelled" },
];

export function AdminRidesFilters({
    statusFilter,
    onStatusFilterChange,
    searchInput,
    onSearchInputChange,
}: AdminRidesFiltersProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap gap-3 mb-6 items-center">
            <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => onStatusFilterChange(f.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            statusFilter === f.key
                                ? "bg-(--color-text-primary) text-(--color-card)"
                                : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
                        }`}
                    >
                        {t(f.labelKey)}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 border border-(--color-border) rounded-xl px-3 py-2 bg-(--color-card) ml-auto min-w-55">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-(--color-text-secondary) shrink-0"
                >
                    <circle
                        cx="11"
                        cy="11"
                        r="8"
                    />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    className="bg-transparent border-none outline-none text-sm text-(--color-text-primary) w-full"
                    placeholder={t("admin.searchRides")}
                    value={searchInput}
                    onChange={(e) => onSearchInputChange(e.target.value)}
                />
            </div>
        </div>
    );
}
