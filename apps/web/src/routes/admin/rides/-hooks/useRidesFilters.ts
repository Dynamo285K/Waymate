import { useState } from "react";
import { useDebounced } from "../../../../hooks/shared/useDebounced";
import type { RideStatus } from "../../../../api-client/model/rideStatus";

export type StatusFilter = "ALL" | RideStatus;

const SEARCH_DEBOUNCE_MS = 300;

// Owns the admin-rides filter state and derives the (debounced) query params
// consumed by useAdminRidesList, so the page component stays a lean
// orchestrator. `controls` is spread straight onto <AdminRidesFilters />.
export function useRidesFilters() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

    const trimmedSearch = debouncedSearch.trim();
    const queryParams = {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    };

    return {
        controls: {
            statusFilter,
            onStatusFilterChange: setStatusFilter,
            searchInput,
            onSearchInputChange: setSearchInput,
        },
        queryParams,
    };
}
