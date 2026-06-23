import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "@waymate/ui";
import { FilterSelect } from "../../../../features/admin/components/FilterSelect";
import { useGetReviewsAdminCounts } from "../../../../api-client/reviews/reviews";
import type { ReviewStatus } from "../../../../api-client/model/reviewStatus";
import type { GetReviewsAdminSubjectRole } from "../../../../api-client/model/getReviewsAdminSubjectRole";

type StatusFilter = "ALL" | ReviewStatus;

type AdminReviewsFiltersProps = {
    statusFilter: StatusFilter;
    onStatusFilterChange: (value: StatusFilter) => void;
    ratingFilter: number | null;
    onRatingFilterChange: (value: number | null) => void;
    targetRoleFilter: GetReviewsAdminSubjectRole | null;
    onTargetRoleFilterChange: (
        value: GetReviewsAdminSubjectRole | null
    ) => void;
    searchInput: string;
    onSearchInputChange: (value: string) => void;
};

export function AdminReviewsFilters({
    statusFilter,
    onStatusFilterChange,
    ratingFilter,
    onRatingFilterChange,
    targetRoleFilter,
    onTargetRoleFilterChange,
    searchInput,
    onSearchInputChange,
}: AdminReviewsFiltersProps) {
    const { t } = useTranslation();
    const countsQuery = useGetReviewsAdminCounts({
        query: { staleTime: 30_000 },
    });
    const counts = countsQuery.data;

    const tabs: { key: StatusFilter; label: string; count?: number }[] = [
        {
            key: "ALL",
            label: t("admin.all"),
            count: counts?.all,
        },
        {
            key: "VISIBLE",
            label: t("admin.visible"),
            count: counts?.visible,
        },
        {
            key: "HIDDEN",
            label: t("admin.hidden"),
            count: counts?.hidden,
        },
    ];

    const ratingOptions: { value: number | null; label: string }[] = [
        { value: null, label: t("admin.allRatings") },
        { value: 1, label: "★☆☆☆☆" },
        { value: 2, label: "★★☆☆☆" },
        { value: 3, label: "★★★☆☆" },
        { value: 4, label: "★★★★☆" },
        { value: 5, label: "★★★★★" },
    ];

    const targetOptions: {
        value: GetReviewsAdminSubjectRole | null;
        label: string;
    }[] = [
        { value: null, label: t("admin.allTargets") },
        { value: "DRIVER", label: t("admin.driver") },
        { value: "PASSENGER", label: t("admin.passenger") },
    ];

    return (
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex w-full gap-1 overflow-x-auto bg-card border border-border rounded-xl p-1 sm:w-auto">
                {tabs.map((tab) => (
                    <Button
                        key={tab.key}
                        variant="unstyled"
                        onClick={() => onStatusFilterChange(tab.key)}
                        className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                            statusFilter === tab.key
                                ? "bg-text-primary text-card"
                                : "text-text-secondary hover:text-text-primary"
                        }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span
                                className={`text-xs font-bold ${
                                    statusFilter === tab.key
                                        ? "opacity-80"
                                        : "text-text-secondary"
                                }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </Button>
                ))}
            </div>

            <FilterSelect
                ariaLabel={t("admin.allRatings")}
                value={ratingFilter === null ? "all" : String(ratingFilter)}
                onValueChange={(value) =>
                    onRatingFilterChange(value === "all" ? null : Number(value))
                }
                options={ratingOptions.map((opt) => ({
                    value: opt.value === null ? "all" : String(opt.value),
                    label: opt.label,
                }))}
            />

            <FilterSelect
                ariaLabel={t("admin.allTargets")}
                value={targetRoleFilter ?? "ALL"}
                onValueChange={(value) =>
                    onTargetRoleFilterChange(
                        value === "ALL"
                            ? null
                            : (value as GetReviewsAdminSubjectRole)
                    )
                }
                options={targetOptions.map((opt) => ({
                    value: opt.value ?? "ALL",
                    label: opt.label,
                }))}
            />

            <div className="w-full sm:ml-auto sm:max-w-xs">
                <SearchInput
                    value={searchInput}
                    onChange={onSearchInputChange}
                    placeholder={t("admin.searchReviews")}
                />
            </div>
        </div>
    );
}
