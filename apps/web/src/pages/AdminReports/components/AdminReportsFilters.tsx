import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "@waymate/ui";
import { FilterSelect } from "../../../components/FilterSelect";
import type { ReportStatus } from "../../../api-client/model/reportStatus";
import type { ReportType } from "../../../api-client/model/reportType";

type StatusFilter = "ALL" | ReportStatus;
type TypeFilter = "ALL" | ReportType;

type AdminReportsFiltersProps = {
    statusFilter: StatusFilter;
    onStatusFilterChange: (value: StatusFilter) => void;
    typeFilter: TypeFilter;
    onTypeFilterChange: (value: TypeFilter) => void;
    searchInput: string;
    onSearchInputChange: (value: string) => void;
};

const STATUS_FILTERS: ReadonlyArray<{ key: StatusFilter; labelKey: string }> = [
    { key: "ALL", labelKey: "admin.all" },
    { key: "OPEN", labelKey: "admin.reports.statusOpen" },
    { key: "INVESTIGATING", labelKey: "admin.reports.statusInvestigating" },
    { key: "RESOLVED", labelKey: "admin.reports.statusResolved" },
    { key: "DISMISSED", labelKey: "admin.reports.statusDismissed" },
];

const TYPE_FILTERS: ReadonlyArray<{ key: TypeFilter; labelKey: string }> = [
    { key: "ALL", labelKey: "admin.allTypes" },
    {
        key: "INAPPROPRIATE_BEHAVIOR",
        labelKey: "report.types.inappropriateBehavior",
    },
    { key: "NO_SHOW", labelKey: "report.types.noShow" },
    { key: "OVERCHARGING", labelKey: "report.types.overcharging" },
    { key: "LEFT_LUGGAGE", labelKey: "report.types.leftLuggage" },
    { key: "SAFETY_ISSUE", labelKey: "report.types.safetyIssue" },
    { key: "OTHER", labelKey: "report.types.other" },
];

export function AdminReportsFilters({
    statusFilter,
    onStatusFilterChange,
    typeFilter,
    onTypeFilterChange,
    searchInput,
    onSearchInputChange,
}: AdminReportsFiltersProps) {
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
            <FilterSelect
                ariaLabel={t("admin.allTypes")}
                value={typeFilter}
                onValueChange={onTypeFilterChange}
                options={TYPE_FILTERS.map((f) => ({
                    value: f.key,
                    label: t(f.labelKey),
                }))}
            />
            <div className="ml-auto min-w-55">
                <SearchInput
                    value={searchInput}
                    onChange={onSearchInputChange}
                    placeholder={t("admin.reports.searchPlaceholder")}
                />
            </div>
        </div>
    );
}
