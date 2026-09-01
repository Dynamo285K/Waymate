import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    usePatchBookingsByIdDriverCancel,
    getGetBookingsRequestsQueryKey,
} from "../../../../../api-client/bookings/bookings";
import {
    getGetRidesByIdPassengersQueryKey,
    getGetRidesMeQueryKey,
} from "../../../../../api-client/rides/rides";
import type { ApiMutationError } from "../../../../../lib/api-fetcher";
import { getErrorI18nKey } from "../../../../../lib/api-errors";

type CancelBookingByDriverInput = {
    bookingId: string;
    rideId?: string;
    reason?: string;
};

export function useCancelBookingByDriver() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const mutation = usePatchBookingsByIdDriverCancel<ApiMutationError>({
        mutation: {
            onError: (error) =>
                toast.error(
                    t(
                        getErrorI18nKey(
                            error,
                            {},
                            "toast.cancelBookingDriverError"
                        )
                    )
                ),
            onSuccess: () => {
                toast.success(t("toast.cancelBookingDriverSuccess"));
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesMeQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetBookingsRequestsQueryKey(),
                });
            },
        },
    });

    const invalidateRidePassengers = (rideId?: string) => {
        if (!rideId) return;
        void queryClient.invalidateQueries({
            queryKey: getGetRidesByIdPassengersQueryKey(rideId),
        });
    };

    return {
        ...mutation,
        mutate: ({ bookingId, rideId, reason }: CancelBookingByDriverInput) =>
            mutation.mutate(
                { id: bookingId, data: { reason } },
                { onSuccess: () => invalidateRidePassengers(rideId) }
            ),
        mutateAsync: ({
            bookingId,
            rideId,
            reason,
        }: CancelBookingByDriverInput) =>
            mutation.mutateAsync(
                { id: bookingId, data: { reason } },
                { onSuccess: () => invalidateRidePassengers(rideId) }
            ),
    };
}
