import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "@waymate/ui";
import type { ReviewStatus } from "../../../api-client/model/reviewStatus";

type StatusFilter = "ALL" | ReviewStatus;

type AdminReviewsFiltersProps = {
    statusFilter: StatusFilter;
    onStatusFilterChange: (value: StatusFilter) => void;
    ratingFilter: "ALL" | "LOW";
    onRatingFilterChange: (value: "ALL" | "LOW") => void;
    searchInput: string;
    onSearchInputChange: (value: string) => void;
};

const STATUS_FILTERS: ReadonlyArray<{ key: StatusFilter; labelKey: string }> = [
    { key: "ALL", labelKey: "admin.all" },
    { key: "VISIBLE", labelKey: "admin.visible" },
    { key: "HIDDEN", labelKey: "admin.hidden" },
    { key: "REMOVED", labelKey: "admin.removed" },
];

export function AdminReviewsFilters({
    statusFilter,
    onStatusFilterChange,
    ratingFilter,
    onRatingFilterChange,
    searchInput,
    onSearchInputChange,
}: AdminReviewsFiltersProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap gap-3 mb-6 items-center">
            <div className="flex gap-1 bg-(--color-card) border border-(--color-border) rounded-xl p-1">
                {STATUS_FILTERS.map((f) => (
                    <Button
                        key={f.key}
                        variant="unstyled"
                        onClick={() => onStatusFilterChange(f.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            statusFilter === f.key
                                ? "bg-(--color-text-primary) text-(--color-card)"
                                : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
                        }`}
                    >
                        {t(f.labelKey)}
                    </Button>
                ))}
            </div>
            <Button
                onClick={() =>
                    onRatingFilterChange(ratingFilter === "LOW" ? "ALL" : "LOW")
                }
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    ratingFilter === "LOW"
                        ? "bg-(--color-danger-bg) text-(--color-danger-text) border border-(--color-danger-border)"
                        : "border border-(--color-border) text-(--color-text-secondary) hover:text-(--color-text-primary)"
                }`}
            >
                {t("admin.lowRatingOnly")}
            </Button>
            <div className="ml-auto min-w-55">
                <SearchInput
                    value={searchInput}
                    onChange={onSearchInputChange}
                    placeholder={t("admin.searchReviews")}
                />
            </div>
        </div>
    );
}
