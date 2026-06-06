import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchBookingsByIdDriverCancel,
    getGetBookingsRequestsQueryKey,
} from "../../../../api-client/bookings/bookings";
import {
    getGetRidesByIdPassengersQueryKey,
    getGetRidesMeQueryKey,
} from "../../../../api-client/rides/rides";
import type { ApiMutationError } from "../../../../lib/api-fetcher";

type CancelBookingByDriverInput = {
    bookingId: string;
    rideId?: string;
    reason?: string;
};

export function useCancelBookingByDriver() {
    const queryClient = useQueryClient();

    const mutation = usePatchBookingsByIdDriverCancel<ApiMutationError>({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesMeQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetBookingsRequestsQueryKey(),
                });
            },
        },
    });

    const invalidateRidePassengers = (rideId?: string) => {
        if (!rideId) return;
        void queryClient.invalidateQueries({
            queryKey: getGetRidesByIdPassengersQueryKey(rideId),
        });
    };

    return {
        ...mutation,
        mutate: ({ bookingId, rideId, reason }: CancelBookingByDriverInput) =>
            mutation.mutate(
                { id: bookingId, data: { reason } },
                { onSuccess: () => invalidateRidePassengers(rideId) }
            ),
        mutateAsync: ({
            bookingId,
            rideId,
            reason,
        }: CancelBookingByDriverInput) =>
            mutation.mutateAsync(
                { id: bookingId, data: { reason } },
                { onSuccess: () => invalidateRidePassengers(rideId) }
            ),
    };
}
