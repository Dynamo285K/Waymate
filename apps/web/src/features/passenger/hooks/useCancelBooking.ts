import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchBookingsByIdCancel,
    getGetBookingsMeQueryKey,
} from "../../../api-client/bookings/bookings";
import {
    getGetRidesAvailableQueryKey,
    getGetRidesSearchQueryKey,
} from "../../../api-client/rides/rides";
import type { PatchBookingsByIdCancelMutationResult } from "../../../api-client/bookings/bookings";
import type { ApiMutationError } from "../../../lib/api-fetcher";

type Vars = { id: string; data: { reason?: string } };

export function useCancelBooking() {
    const queryClient = useQueryClient();

    const mutation = usePatchBookingsByIdCancel<ApiMutationError>({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetBookingsMeQueryKey(),
                });
                // Cancelling frees a seat, so availability/search seat counts
                // change — mirror useCreateBooking's invalidation set.
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesAvailableQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesSearchQueryKey(),
                });
            },
        },
    });

    return {
        ...mutation,
        mutate: (
            bookingId: string,
            reason?: string,
            options?: MutateOptions<
                PatchBookingsByIdCancelMutationResult,
                ApiMutationError,
                Vars,
                unknown
            >
        ) => mutation.mutate({ id: bookingId, data: { reason } }, options),
        mutateAsync: (bookingId: string, reason?: string) =>
            mutation.mutateAsync({ id: bookingId, data: { reason } }),
    };
}
