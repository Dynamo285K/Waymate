import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    usePatchRidesAdminByIdCancel,
    getGetRidesAdminQueryKey,
    getGetRidesAdminByIdQueryKey,
} from "../../../../api-client/rides/rides";
import type { AdminCancelRideResponse } from "../../../../api-client/model/adminCancelRideResponse";
import type { ApiMutationError } from "../../../../lib/api-fetcher";
import { getErrorI18nKey } from "../../../../lib/api-errors";

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
    const { t } = useTranslation();

    const mutation = usePatchRidesAdminByIdCancel<ApiMutationError>({
        mutation: {
            onError: (error) =>
                toast.error(
                    t(getErrorI18nKey(error, {}, "toast.adminCancelRideError"))
                ),
            onSuccess: (_data, variables) => {
                toast.success(t("toast.adminCancelRideSuccess"));
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesAdminQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesAdminByIdQueryKey(variables.id),
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
