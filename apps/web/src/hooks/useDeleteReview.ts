import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    useDeleteAdminReviewsById,
    getGetAdminReviewsQueryKey,
    getGetAdminReviewsCountsQueryKey,
} from "../api-client/admin/admin";
import type { AdminDeleteReviewResponse } from "../api-client/model/adminDeleteReviewResponse";
import type { ReviewId } from "../api-client/model/reviewId";
import type { ApiMutationError } from "../lib/api-fetcher";

type MutationVars = { id: ReviewId };

export function useDeleteReview() {
    const queryClient = useQueryClient();

    const mutation = useDeleteAdminReviewsById<ApiMutationError>({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminReviewsQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminReviewsCountsQueryKey(),
                });
            },
        },
    });

    return {
        ...mutation,
        mutate: (
            id: ReviewId,
            options?: MutateOptions<
                AdminDeleteReviewResponse,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutate({ id }, options),
    };
}
