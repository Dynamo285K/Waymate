import { useState } from "react";
import { useDebounced } from "../../../../hooks/shared/useDebounced";

const SEARCH_DEBOUNCE_MS = 300;

// Owns the admin-users search state and derives the (debounced) query params
// consumed by useAdminUsersList, so the page component stays a lean
// orchestrator. `controls` is spread straight onto <AdminUsersFilters />.
export function useUsersFilters() {
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

    const trimmedSearch = debouncedSearch.trim();
    const queryParams = {
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    };

    return {
        controls: {
            searchInput,
            onSearchInputChange: setSearchInput,
        },
        queryParams,
    };
}
