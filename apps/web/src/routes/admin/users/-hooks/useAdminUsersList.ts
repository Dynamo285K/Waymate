import { useInfiniteQuery } from "@tanstack/react-query";
import {
    getAdminUsers,
    getGetAdminUsersQueryKey,
} from "../../../../api-client/admin/admin";

const PAGE_SIZE = 20;

export type AdminUsersListFilters = {
    search?: string;
};

export function useAdminUsersList(filters: AdminUsersListFilters) {
    // Cursor lives in pageParam, not in the queryKey — that way a search
    // change starts a fresh infinite query while load-more keeps reusing
    // the same cached pages.
    const query = useInfiniteQuery({
        queryKey: getGetAdminUsersQueryKey({
            limit: PAGE_SIZE,
            search: filters.search,
        }),
        queryFn: ({ pageParam }) =>
            getAdminUsers({
                limit: PAGE_SIZE,
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
