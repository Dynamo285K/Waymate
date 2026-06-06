import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchAdminReportsByIdStatus,
    getGetAdminReportsQueryKey,
    getGetAdminReportsByIdQueryKey,
} from "../../../../api-client/admin/admin";
import type { AdminReportDetailResponse } from "../../../../api-client/model/adminReportDetailResponse";
import type { ReportStatus } from "../../../../api-client/model/reportStatus";
import type { ApiMutationError } from "../../../../lib/api-fetcher";

type SetReportStatusInput = {
    reportId: string;
    status: ReportStatus;
    reason?: string;
};

type MutationVars = {
    id: string;
    data: { status: ReportStatus; reason?: string };
};

export function useSetReportStatus() {
    const queryClient = useQueryClient();

    const mutation = usePatchAdminReportsByIdStatus<ApiMutationError>({
        mutation: {
            onSuccess: (_data, variables) => {
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminReportsQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminReportsByIdQueryKey(variables.id),
                });
            },
        },
    });

    const toVars = ({
        reportId,
        status,
        reason,
    }: SetReportStatusInput): MutationVars => ({
        id: reportId,
        data: reason ? { status, reason } : { status },
    });

    return {
        ...mutation,
        mutate: (
            input: SetReportStatusInput,
            options?: MutateOptions<
                AdminReportDetailResponse,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: SetReportStatusInput,
            options?: MutateOptions<
                AdminReportDetailResponse,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
