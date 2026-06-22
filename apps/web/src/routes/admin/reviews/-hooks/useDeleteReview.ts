import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    useDeleteReviewsAdminById,
    getGetReviewsAdminQueryKey,
    getGetReviewsAdminCountsQueryKey,
} from "../../../../api-client/reviews/reviews";
import type { AdminDeleteReviewResponse } from "../../../../api-client/model/adminDeleteReviewResponse";
import type { ReviewId } from "../../../../api-client/model/reviewId";
import type { ApiMutationError } from "../../../../lib/api-fetcher";

type MutationVars = { id: ReviewId };

export function useDeleteReview() {
    const queryClient = useQueryClient();

    const mutation = useDeleteReviewsAdminById<ApiMutationError>({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetReviewsAdminQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetReviewsAdminCountsQueryKey(),
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
