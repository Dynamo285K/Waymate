import { useQueryClient } from "@tanstack/react-query";
import {
    useGetBookingsRequests,
    usePatchBookingsByIdConfirm,
    usePatchBookingsByIdReject,
    getGetBookingsRequestsQueryKey,
} from "../api-client/bookings/bookings";
import { getGetRidesMeQueryKey } from "../api-client/rides/rides";
import type { DriverRideRequestItem } from "../api-client/model/driverRideRequestItem";

export type DriverRideRequest = DriverRideRequestItem;

const requestsQueryKey = getGetBookingsRequestsQueryKey();

export function useDriverRideRequests() {
    return useGetBookingsRequests();
}

type ManageRideRequestInput = {
    bookingId: string;
};

function useOptimisticRemoval<TVars extends { id: string }>() {
    const queryClient = useQueryClient();

    return {
        onMutate: async (variables: TVars) => {
            await queryClient.cancelQueries({ queryKey: requestsQueryKey });

            const previous =
                queryClient.getQueryData<DriverRideRequest[]>(requestsQueryKey);

            queryClient.setQueryData<DriverRideRequest[]>(
                requestsQueryKey,
                (requests) =>
                    requests?.filter((req) => req.id !== variables.id) ?? []
            );

            return { previous };
        },
        onError: (
            _error: unknown,
            _vars: TVars,
            context?: { previous?: DriverRideRequest[] }
        ) => {
            if (context?.previous !== undefined) {
                queryClient.setQueryData(requestsQueryKey, context.previous);
            }
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: requestsQueryKey });
            void queryClient.invalidateQueries({
                queryKey: getGetRidesMeQueryKey(),
            });
        },
    };
}

export function useAcceptRideRequest() {
    const handlers = useOptimisticRemoval<{ id: string }>();

    const mutation = usePatchBookingsByIdConfirm({
        mutation: handlers,
    });

    return {
        ...mutation,
        mutate: ({ bookingId }: ManageRideRequestInput) =>
            mutation.mutate({ id: bookingId }),
        mutateAsync: ({ bookingId }: ManageRideRequestInput) =>
            mutation.mutateAsync({ id: bookingId }),
    };
}

export function useDeclineRideRequest() {
    const handlers = useOptimisticRemoval<{
        id: string;
        data: { reason?: string };
    }>();

    const mutation = usePatchBookingsByIdReject({
        mutation: handlers,
    });

    return {
        ...mutation,
        mutate: ({ bookingId }: ManageRideRequestInput) =>
            mutation.mutate({
                id: bookingId,
                data: { reason: "Driver rejected booking" },
            }),
        mutateAsync: ({ bookingId }: ManageRideRequestInput) =>
            mutation.mutateAsync({
                id: bookingId,
                data: { reason: "Driver rejected booking" },
            }),
    };
}
