import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchRidesByIdCancel,
    getGetRidesMeQueryKey,
} from "../api-client/rides/rides";
import type { CancelRideResponse } from "../api-client/model/cancelRideResponse";

type CancelRideInput = {
    rideId: string;
    reason?: string;
};

type MutationVars = { id: string; data: { reason?: string } };

export function useCancelRide() {
    const queryClient = useQueryClient();

    const mutation = usePatchRidesByIdCancel({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesMeQueryKey(),
                });
            },
        },
    });

    const toVars = ({ rideId, reason }: CancelRideInput): MutationVars => ({
        id: rideId,
        data: { reason },
    });

    return {
        ...mutation,
        mutate: (
            input: CancelRideInput,
            options?: MutateOptions<
                CancelRideResponse,
                unknown,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: CancelRideInput,
            options?: MutateOptions<
                CancelRideResponse,
                unknown,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
