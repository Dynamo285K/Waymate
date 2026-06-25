import { useState } from "react";
import { useDebounced } from "../../../../hooks/shared/useDebounced";
import type { ReviewStatus } from "../../../../api-client/model/reviewStatus";
import type { GetReviewsAdminSubjectRole } from "../../../../api-client/model/getReviewsAdminSubjectRole";

export type StatusFilter = "ALL" | ReviewStatus;

const SEARCH_DEBOUNCE_MS = 300;

// Owns the admin-reviews filter state and derives the (debounced) query params
// consumed by useAdminReviewsList, so the page component stays a lean
// orchestrator. `controls` is spread straight onto <AdminReviewsFilters />.
export function useReviewsFilters() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [targetRoleFilter, setTargetRoleFilter] =
        useState<GetReviewsAdminSubjectRole | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

    const trimmedSearch = debouncedSearch.trim();
    const queryParams = {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        minRating: ratingFilter ?? undefined,
        maxRating: ratingFilter ?? undefined,
        subjectRole: targetRoleFilter ?? undefined,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    };

    return {
        controls: {
            statusFilter,
            onStatusFilterChange: setStatusFilter,
            ratingFilter,
            onRatingFilterChange: setRatingFilter,
            targetRoleFilter,
            onTargetRoleFilterChange: setTargetRoleFilter,
            searchInput,
            onSearchInputChange: setSearchInput,
        },
        queryParams,
    };
}
