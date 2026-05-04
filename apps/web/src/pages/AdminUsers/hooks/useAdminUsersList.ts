import { useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { getGetAdminUsersQueryOptions } from "../../../api-client/admin/admin";
import type { UserRole } from "../../../api-client/model/userRole";

const PAGE_SIZE = 20;

export type AdminUsersListFilters = {
    search?: string;
    userRole?: UserRole;
};

export function useAdminUsersList(filters: AdminUsersListFilters) {
    const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);

    // Reset cursors in-render when filters change. Doing this in a useEffect
    // would render one frame with stale (mismatched) cursors against the new
    // filters and could fire load-more against an outdated nextCursor.
    const filterKey = JSON.stringify(filters);
    const prevFilterKey = useRef(filterKey);
    if (prevFilterKey.current !== filterKey) {
        prevFilterKey.current = filterKey;
        setCursors([undefined]);
    }

    const queries = useQueries({
        queries: cursors.map((cursor) =>
            getGetAdminUsersQueryOptions({
                limit: PAGE_SIZE,
                cursor,
                userRole: filters.userRole,
                search: filters.search,
            })
        ),
    });

    const items = queries.flatMap((q) => q.data?.items ?? []);
    const last = queries[queries.length - 1];
    const nextCursor = last?.data?.nextCursor ?? null;

    const firstError = queries.find((q) => q.isError)?.error;

    return {
        items,
        nextCursor,
        isInitialLoading: queries[0]?.isLoading ?? false,
        isFetching: queries.some((q) => q.isFetching),
        isError: queries.some((q) => q.isError),
        error: firstError,
        loadMore: () => {
            if (nextCursor) {
                setCursors((prev) => [...prev, nextCursor]);
            }
        },
    };
}
