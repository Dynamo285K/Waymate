import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

type CreateBookingInput = {
    rideId: string;
    pickupStopId: string;
    dropoffStopId: string;
    seatCount?: number;
};

export function useCreateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            rideId,
            pickupStopId,
            dropoffStopId,
            seatCount = 1,
        }: CreateBookingInput) =>
            unwrap(
                api.bookings.post({
                    rideId,
                    pickupStopId,
                    dropoffStopId,
                    seatCount,
                })
            ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ["bookings", "me"],
            });
        },
    });
}
