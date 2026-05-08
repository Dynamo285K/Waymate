import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "@waymate/ui";
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
                    <Button
                        key={f.key}
                        onClick={() => onStatusFilterChange(f.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            statusFilter === f.key
                                ? "bg-(--color-text-primary) text-(--color-card)"
                                : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
                        }`}
                    >
                        {t(f.labelKey)}
                    </Button>
                ))}
            </div>
            <div className="ml-auto min-w-55">
                <SearchInput
                    value={searchInput}
                    onChange={onSearchInputChange}
                    placeholder={t("admin.searchRides")}
                />
            </div>
        </div>
    );
}
