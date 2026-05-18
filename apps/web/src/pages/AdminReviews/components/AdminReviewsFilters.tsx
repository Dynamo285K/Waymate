import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "@waymate/ui";
import { useGetAdminReviewsCounts } from "../../../api-client/admin/admin";
import type { ReviewStatus } from "../../../api-client/model/reviewStatus";
import type { GetAdminReviewsSubjectRole } from "../../../api-client/model/getAdminReviewsSubjectRole";

type StatusFilter = "ALL" | ReviewStatus;

type AdminReviewsFiltersProps = {
    statusFilter: StatusFilter;
    onStatusFilterChange: (value: StatusFilter) => void;
    ratingFilter: number | null;
    onRatingFilterChange: (value: number | null) => void;
    targetRoleFilter: GetAdminReviewsSubjectRole | null;
    onTargetRoleFilterChange: (
        value: GetAdminReviewsSubjectRole | null
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
    const countsQuery = useGetAdminReviewsCounts({
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
        value: GetAdminReviewsSubjectRole | null;
        label: string;
    }[] = [
        { value: null, label: t("admin.allTargets") },
        { value: "DRIVER", label: t("admin.driver") },
        { value: "PASSENGER", label: t("admin.passenger") },
    ];

    return (
        <div className="flex flex-wrap gap-3 mb-6 items-center">
            <div className="flex gap-1 bg-(--color-card) border border-(--color-border) rounded-xl p-1">
                {tabs.map((tab) => (
                    <Button
                        key={tab.key}
                        variant="unstyled"
                        onClick={() => onStatusFilterChange(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                            statusFilter === tab.key
                                ? "bg-(--color-text-primary) text-(--color-card)"
                                : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
                        }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span
                                className={`text-xs font-bold ${
                                    statusFilter === tab.key
                                        ? "opacity-80"
                                        : "text-(--color-text-secondary)"
                                }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </Button>
                ))}
            </div>

            <select
                value={ratingFilter ?? ""}
                onChange={(e) => {
                    const v = e.target.value;
                    onRatingFilterChange(v === "" ? null : Number(v));
                }}
                className="border border-(--color-border) rounded-xl px-3 py-2 text-sm bg-(--color-card) text-(--color-text-primary) cursor-pointer"
            >
                {ratingOptions.map((opt) => (
                    <option
                        key={opt.value ?? "all"}
                        value={opt.value ?? ""}
                    >
                        {opt.label}
                    </option>
                ))}
            </select>

            <select
                value={targetRoleFilter ?? ""}
                onChange={(e) => {
                    const v = e.target.value as GetAdminReviewsSubjectRole | "";
                    onTargetRoleFilterChange(v === "" ? null : v);
                }}
                className="border border-(--color-border) rounded-xl px-3 py-2 text-sm bg-(--color-card) text-(--color-text-primary) cursor-pointer"
            >
                {targetOptions.map((opt) => (
                    <option
                        key={opt.value ?? "all"}
                        value={opt.value ?? ""}
                    >
                        {opt.label}
                    </option>
                ))}
            </select>

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
