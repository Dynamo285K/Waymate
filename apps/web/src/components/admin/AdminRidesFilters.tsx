import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "@waymate/ui";
import type { RideStatus } from "../../api-client/model/rideStatus";

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="flex flex-wrap gap-1 bg-(--color-card) border border-(--color-border) rounded-xl p-1 self-start">
                {STATUS_FILTERS.map((f) => (
                    <Button
                        key={f.key}
                        variant="unstyled"
                        onClick={() => onStatusFilterChange(f.key)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            statusFilter === f.key
                                ? "bg-(--color-text-primary) text-(--color-card)"
                                : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
                        }`}
                    >
                        {t(f.labelKey)}
                    </Button>
                ))}
            </div>
            <div className="sm:ml-auto w-full sm:max-w-xs">
                <SearchInput
                    value={searchInput}
                    onChange={onSearchInputChange}
                    placeholder={t("admin.searchRides")}
                />
            </div>
        </div>
    );
}
