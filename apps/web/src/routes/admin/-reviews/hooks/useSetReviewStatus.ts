import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchAdminReviewsByIdStatus,
    getGetAdminReviewsQueryKey,
    getGetAdminReviewsByIdQueryKey,
} from "../../../../api-client/admin/admin";
import type { AdminReviewListItem } from "../../../../api-client/model/adminReviewListItem";
import type { ReviewStatus } from "../../../../api-client/model/reviewStatus";
import type { ApiMutationError } from "../../../../lib/api-fetcher";

type SetReviewStatusInput = {
    reviewId: string;
    status: ReviewStatus;
    reason: string;
};

type MutationVars = {
    id: string;
    data: { status: ReviewStatus; reason: string };
};

export function useSetReviewStatus() {
    const queryClient = useQueryClient();

    const mutation = usePatchAdminReviewsByIdStatus<ApiMutationError>({
        mutation: {
            onSuccess: (_data, variables) => {
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminReviewsQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminReviewsByIdQueryKey(variables.id),
                });
            },
        },
    });

    const toVars = ({
        reviewId,
        status,
        reason,
    }: SetReviewStatusInput): MutationVars => ({
        id: reviewId,
        data: { status, reason },
    });

    return {
        ...mutation,
        mutate: (
            input: SetReviewStatusInput,
            options?: MutateOptions<
                AdminReviewListItem,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: SetReviewStatusInput,
            options?: MutateOptions<
                AdminReviewListItem,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
