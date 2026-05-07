import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchAdminRidesByIdCancel,
    getGetAdminRidesQueryKey,
    getGetAdminRidesByIdQueryKey,
} from "../api-client/admin/admin";
import type { AdminCancelRideResponse } from "../api-client/model/adminCancelRideResponse";
import type { ApiMutationError } from "../lib/api-fetcher";

type CancelRideInput = {
    rideId: string;
    reason: string;
};

type MutationVars = {
    id: string;
    data: { reason: string };
};

export function useAdminCancelRide() {
    const queryClient = useQueryClient();

    const mutation = usePatchAdminRidesByIdCancel<ApiMutationError>({
        mutation: {
            onSuccess: (_data, variables) => {
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminRidesQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminRidesByIdQueryKey(variables.id),
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
                AdminCancelRideResponse,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: CancelRideInput,
            options?: MutateOptions<
                AdminCancelRideResponse,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
