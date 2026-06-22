import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    usePatchBookingsByIdCancel,
    getGetBookingsMeQueryKey,
} from "../../../api-client/bookings/bookings";
import {
    getGetRidesAvailableQueryKey,
    getGetRidesSearchQueryKey,
} from "../../../api-client/rides/rides";
import type { PatchBookingsByIdCancelMutationResult } from "../../../api-client/bookings/bookings";
import type { ApiMutationError } from "../../../lib/api-fetcher";
import { getErrorI18nKey } from "../../../lib/api-errors";

type Vars = { id: string; data: { reason?: string } };

export function useCancelBooking() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const mutation = usePatchBookingsByIdCancel<ApiMutationError>({
        mutation: {
            onError: (error) =>
                toast.error(
                    t(getErrorI18nKey(error, {}, "cancelBookingDialog.error"))
                ),
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

    return {
        ...mutation,
        mutate: (
            bookingId: string,
            reason?: string,
            options?: MutateOptions<
                PatchBookingsByIdCancelMutationResult,
                ApiMutationError,
                Vars,
                unknown
            >
        ) => mutation.mutate({ id: bookingId, data: { reason } }, options),
        mutateAsync: (bookingId: string, reason?: string) =>
            mutation.mutateAsync({ id: bookingId, data: { reason } }),
    };
}
