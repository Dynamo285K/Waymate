import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    usePatchRidesByIdCancel,
    getGetRidesMeQueryKey,
} from "../../../api-client/rides/rides";
import type { CancelRideResponse } from "../../../api-client/model/cancelRideResponse";
import type { ApiMutationError } from "../../../lib/api-fetcher";
import { getErrorI18nKey } from "../../../lib/api-errors";

type CancelRideInput = {
    rideId: string;
    reason?: string;
};

type MutationVars = { id: string; data: { reason?: string } };

export function useCancelRide() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const mutation = usePatchRidesByIdCancel<ApiMutationError>({
        mutation: {
            onError: (error) =>
                toast.error(
                    t(getErrorI18nKey(error, {}, "toast.cancelRideError"))
                ),
            onSuccess: () => {
                toast.success(t("toast.cancelRideSuccess"));
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
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: CancelRideInput,
            options?: MutateOptions<
                CancelRideResponse,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
