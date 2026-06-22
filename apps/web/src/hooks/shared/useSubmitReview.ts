import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    usePostReviews,
    getGetReviewsMeAuthoredQueryKey,
    getGetReviewsUsersByUserIdQueryKey,
} from "../../api-client/reviews/reviews";
import { getGetRidesByIdPassengersQueryKey } from "../../api-client/rides/rides";
import { getGetBookingsMeQueryKey } from "../../api-client/bookings/bookings";
import type { ApiMutationError } from "../../lib/api-fetcher";
import { getErrorI18nKey } from "../../lib/api-errors";

export function useSubmitReview() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    return usePostReviews<ApiMutationError>({
        mutation: {
            onError: (error) =>
                toast.error(t(getErrorI18nKey(error, {}, "rateDriver.error"))),
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
