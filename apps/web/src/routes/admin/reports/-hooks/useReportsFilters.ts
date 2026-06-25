import { useState } from "react";
import { useDebounced } from "../../../../hooks/shared/useDebounced";
import type { ReportStatus } from "../../../../api-client/model/reportStatus";
import type { ReportType } from "../../../../api-client/model/reportType";

export type StatusFilter = "ALL" | ReportStatus;
export type TypeFilter = "ALL" | ReportType;

const SEARCH_DEBOUNCE_MS = 300;

// Owns the admin-reports filter state and derives the (debounced) query params
// consumed by useAdminReportsList, so the page component stays a lean
// orchestrator. `controls` is spread straight onto <AdminReportsFilters />.
export function useReportsFilters() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

    const trimmedSearch = debouncedSearch.trim();
    const queryParams = {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        reportType: typeFilter === "ALL" ? undefined : typeFilter,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    };

    return {
        controls: {
            statusFilter,
            onStatusFilterChange: setStatusFilter,
            typeFilter,
            onTypeFilterChange: setTypeFilter,
            searchInput,
            onSearchInputChange: setSearchInput,
        },
        queryParams,
    };
}
