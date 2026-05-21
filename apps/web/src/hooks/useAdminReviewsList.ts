import { useInfiniteQuery } from "@tanstack/react-query";
import {
    getAdminReviews,
    getGetAdminReviewsQueryKey,
} from "../api-client/admin/admin";
import type { ReviewStatus } from "../api-client/model/reviewStatus";
import type { GetAdminReviewsSubjectRole } from "../api-client/model/getAdminReviewsSubjectRole";

const PAGE_SIZE = 20;

export type AdminReviewsListFilters = {
    status?: ReviewStatus;
    minRating?: number;
    maxRating?: number;
    subjectRole?: GetAdminReviewsSubjectRole;
    search?: string;
};

export function useAdminReviewsList(filters: AdminReviewsListFilters) {
    const query = useInfiniteQuery({
        queryKey: getGetAdminReviewsQueryKey({
            limit: PAGE_SIZE,
            status: filters.status,
            minRating: filters.minRating,
            maxRating: filters.maxRating,
            subjectRole: filters.subjectRole,
            search: filters.search,
        }),
        queryFn: ({ pageParam }) =>
            getAdminReviews({
                limit: PAGE_SIZE,
                status: filters.status,
                minRating: filters.minRating,
                maxRating: filters.maxRating,
                subjectRole: filters.subjectRole,
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
