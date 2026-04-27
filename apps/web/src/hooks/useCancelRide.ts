import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

type CancelRideInput = {
    rideId: string;
    reason?: string;
};

export function useCancelRide() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ rideId, reason }: CancelRideInput) =>
            unwrap(api.rides({ id: rideId }).cancel.patch({ reason })),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ["rides", "me"],
            });
        },
    });
}
