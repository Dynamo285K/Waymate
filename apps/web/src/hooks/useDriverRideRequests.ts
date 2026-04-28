import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

export type DriverRideRequest = {
    id: string;
    rideId: string;
    seatCount: number;
    passenger: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        profilePhotoUrl: string | null;
        averageRating: number | null;
    };
    pickupCity: string;
    dropoffCity: string;
    departureAt: Date | string;
};

const driverRideRequestsQueryKey = ["bookings", "requests"] as const;

export function useDriverRideRequests() {
    return useQuery({
        queryKey: driverRideRequestsQueryKey,
        queryFn: () =>
            unwrap(api.bookings.requests.get()) as Promise<DriverRideRequest[]>,
    });
}

type ManageRideRequestInput = {
    bookingId: string;
};

export function useAcceptRideRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookingId }: ManageRideRequestInput) =>
            unwrap(api.bookings({ id: bookingId }).confirm.patch()),
        onMutate: async ({ bookingId }) => {
            await queryClient.cancelQueries({
                queryKey: driverRideRequestsQueryKey,
            });

            const previousRequests = queryClient.getQueryData<
                DriverRideRequest[]
            >(driverRideRequestsQueryKey);

            queryClient.setQueryData<DriverRideRequest[]>(
                driverRideRequestsQueryKey,
                (requests) =>
                    requests?.filter((request) => request.id !== bookingId) ??
                    []
            );

            return { previousRequests };
        },
        onError: (_error, _input, context) => {
            queryClient.setQueryData(
                driverRideRequestsQueryKey,
                context?.previousRequests
            );
        },
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: driverRideRequestsQueryKey,
            });
            void queryClient.invalidateQueries({
                queryKey: ["rides", "me"],
            });
        },
    });
}

export function useDeclineRideRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookingId }: ManageRideRequestInput) =>
            unwrap(
                api.bookings({ id: bookingId }).reject.patch({
                    reason: "Driver rejected booking",
                })
            ),
        onMutate: async ({ bookingId }) => {
            await queryClient.cancelQueries({
                queryKey: driverRideRequestsQueryKey,
            });

            const previousRequests = queryClient.getQueryData<
                DriverRideRequest[]
            >(driverRideRequestsQueryKey);

            queryClient.setQueryData<DriverRideRequest[]>(
                driverRideRequestsQueryKey,
                (requests) =>
                    requests?.filter((request) => request.id !== bookingId) ??
                    []
            );

            return { previousRequests };
        },
        onError: (_error, _input, context) => {
            queryClient.setQueryData(
                driverRideRequestsQueryKey,
                context?.previousRequests
            );
        },
        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: driverRideRequestsQueryKey,
            });
            void queryClient.invalidateQueries({
                queryKey: ["rides", "me"],
            });
        },
    });
}
