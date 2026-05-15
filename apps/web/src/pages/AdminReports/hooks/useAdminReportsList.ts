import { useInfiniteQuery } from "@tanstack/react-query";
import {
    getAdminReports,
    getGetAdminReportsQueryKey,
} from "../../../api-client/admin/admin";
import type { ReportStatus } from "../../../api-client/model/reportStatus";
import type { ReportType } from "../../../api-client/model/reportType";

const PAGE_SIZE = 20;

export type AdminReportsListFilters = {
    status?: ReportStatus;
    reportType?: ReportType;
    search?: string;
};

export function useAdminReportsList(filters: AdminReportsListFilters) {
    const query = useInfiniteQuery({
        queryKey: getGetAdminReportsQueryKey({
            limit: PAGE_SIZE,
            status: filters.status,
            reportType: filters.reportType,
            search: filters.search,
        }),
        queryFn: ({ pageParam }) =>
            getAdminReports({
                limit: PAGE_SIZE,
                status: filters.status,
                reportType: filters.reportType,
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
