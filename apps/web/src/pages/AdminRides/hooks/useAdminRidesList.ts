import { useInfiniteQuery } from "@tanstack/react-query";
import {
    getAdminRides,
    getGetAdminRidesQueryKey,
} from "../../../api-client/admin/admin";
import type { RideStatus } from "../../../api-client/model/rideStatus";

const PAGE_SIZE = 20;

export type AdminRidesListFilters = {
    status?: RideStatus;
    search?: string;
};

export function useAdminRidesList(filters: AdminRidesListFilters) {
    // Cursor lives in pageParam, not in queryKey — search/status changes
    // start a fresh infinite query while load-more reuses the same cache.
    const query = useInfiniteQuery({
        queryKey: getGetAdminRidesQueryKey({
            limit: PAGE_SIZE,
            status: filters.status,
            search: filters.search,
        }),
        queryFn: ({ pageParam }) =>
            getAdminRides({
                limit: PAGE_SIZE,
                status: filters.status,
                search: filters.search,
                cursor: pageParam,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

    const items = query.data?.pages.flatMap((p) => p.items) ?? [];
    const lastPage = query.data?.pages[query.data.pages.length - 1];
    const nextCursor = lastPage?.nextCursor ?? null;

    return {
        items,
        nextCursor,
        isInitialLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        loadMore: () => {
            void query.fetchNextPage();
        },
    };
}
