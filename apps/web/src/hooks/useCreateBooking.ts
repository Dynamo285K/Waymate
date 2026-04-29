import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePostBookings,
    getGetBookingsMeQueryKey,
} from "../api-client/bookings/bookings";
import {
    getGetRidesAvailableQueryKey,
    getGetRidesSearchQueryKey,
} from "../api-client/rides/rides";
import type { BookingActionResponse } from "../api-client/model/bookingActionResponse";
import type { CreateBookingBody } from "../api-client/model/createBookingBody";

type CreateBookingInput = {
    rideId: string;
    pickupStopId: string;
    dropoffStopId: string;
    seatCount?: number;
};

type MutationVars = { data: CreateBookingBody };

export function useCreateBooking() {
    const queryClient = useQueryClient();

    const mutation = usePostBookings({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetBookingsMeQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesAvailableQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesSearchQueryKey(),
                });
            },
        },
    });

    const toVars = (input: CreateBookingInput): MutationVars => ({
        data: {
            rideId: input.rideId,
            pickupStopId: input.pickupStopId,
            dropoffStopId: input.dropoffStopId,
            seatCount: input.seatCount ?? 1,
        },
    });

    return {
        ...mutation,
        mutate: (
            input: CreateBookingInput,
            options?: MutateOptions<
                BookingActionResponse,
                unknown,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: CreateBookingInput,
            options?: MutateOptions<
                BookingActionResponse,
                unknown,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
