import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    usePostBookings,
    getGetBookingsMeQueryKey,
} from "../../../api-client/bookings/bookings";
import {
    getGetRidesAvailableQueryKey,
    getGetRidesSearchQueryKey,
} from "../../../api-client/rides/rides";
import type { BookingActionResponse } from "../../../api-client/model/bookingActionResponse";
import type { CreateBookingBody } from "../../../api-client/model/createBookingBody";
import type { ApiMutationError } from "../../../lib/api-fetcher";
import { getErrorI18nKey } from "../../../lib/api-errors";

type DynamicStop = { lat: number; lng: number; city: string };

export type CreateBookingInput = {
    rideId: string;
    pickupStopId: string;
    dropoffStopId: string;
    seatCount?: number;
    dynamicPickup?: DynamicStop;
    dynamicDropoff?: DynamicStop;
    priceAmount?: number;
    requestedPickupCity?: string;
    requestedDropoffCity?: string;
};

type MutationVars = { data: CreateBookingBody };

export function useCreateBooking() {
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const mutation = usePostBookings<ApiMutationError>({
        mutation: {
            onError: (error) =>
                toast.error(
                    t(getErrorI18nKey(error, {}, "toast.bookingError"))
                ),
            onSuccess: () => {
                toast.success(t("toast.bookingSuccess"));
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
            dynamicPickup: input.dynamicPickup,
            dynamicDropoff: input.dynamicDropoff,
            priceAmount: input.priceAmount,
            requestedPickupCity: input.requestedPickupCity,
            requestedDropoffCity: input.requestedDropoffCity,
        },
    });

    return {
        ...mutation,
        mutate: (
            input: CreateBookingInput,
            options?: MutateOptions<
                BookingActionResponse,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: CreateBookingInput,
            options?: MutateOptions<
                BookingActionResponse,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
