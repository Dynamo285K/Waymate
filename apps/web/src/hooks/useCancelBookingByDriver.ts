import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

type CancelBookingByDriverInput = {
    bookingId: string;
    rideId?: string;
    reason?: string;
};

export function useCancelBookingByDriver() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookingId, reason }: CancelBookingByDriverInput) =>
            unwrap(
                api.bookings({ id: bookingId }).driver.cancel.patch({
                    reason,
                })
            ),
        onSuccess: (_data, variables) => {
            if (variables.rideId) {
                void queryClient.invalidateQueries({
                    queryKey: ["rides", variables.rideId, "passengers"],
                });
            }
            void queryClient.invalidateQueries({
                queryKey: ["rides", "me"],
            });
            void queryClient.invalidateQueries({
                queryKey: ["bookings", "requests"],
            });
        },
    });
}
