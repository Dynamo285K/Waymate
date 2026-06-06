import { useQueryClient } from "@tanstack/react-query";
import {
    usePostReviews,
    getGetReviewsMeAuthoredQueryKey,
    getGetReviewsUsersByUserIdQueryKey,
} from "../../api-client/reviews/reviews";
import { getGetRidesByIdPassengersQueryKey } from "../../api-client/rides/rides";
import { getGetBookingsMeQueryKey } from "../../api-client/bookings/bookings";
import type { ApiMutationError } from "../../lib/api-fetcher";

export function useSubmitReview() {
    const queryClient = useQueryClient();

    return usePostReviews<ApiMutationError>({
        mutation: {
            onSuccess: (_data, variables) => {
                void queryClient.invalidateQueries({
                    queryKey: getGetReviewsMeAuthoredQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetReviewsUsersByUserIdQueryKey(
                        variables.data.subjectId
                    ),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesByIdPassengersQueryKey(
                        variables.data.rideId
                    ),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetBookingsMeQueryKey(),
                });
            },
        },
    });
}
