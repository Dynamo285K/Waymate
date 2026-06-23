import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchRidesByIdComplete,
    getGetRidesMeQueryKey,
} from "../../../../api-client/rides/rides";
import { useCancelRide } from "../../../../features/driver/hooks/useCancelRide";
import type { ApiMutationError } from "../../../../lib/api-fetcher";

/**
 * Owns the driver "My rides" lifecycle actions — cancel and complete — together
 * with the dialog targets they drive. Keeps the route component a thin
 * orchestrator that only wires these to the list and confirmation dialogs.
 */
export function useDriverRideActions() {
    const queryClient = useQueryClient();
    const [cancellingRideId, setCancellingRideId] = useState<string | null>(
        null
    );
    const [rideToCancel, setRideToCancel] = useState<string | null>(null);
    const [rideToComplete, setRideToComplete] = useState<string | null>(null);

    const cancelRide = useCancelRide();
    const completeRide = usePatchRidesByIdComplete<ApiMutationError>({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesMeQueryKey(),
                });
            },
        },
    });

    function confirmCancel(reason: string) {
        if (!rideToCancel) return;
        const rideId = rideToCancel;
        setCancellingRideId(rideId);
        setRideToCancel(null);
        cancelRide.mutate(
            { rideId, reason },
            { onSettled: () => setCancellingRideId(null) }
        );
    }

    function confirmComplete() {
        if (!rideToComplete) return;
        completeRide.mutate(
            { id: rideToComplete, data: {} },
            { onSettled: () => setRideToComplete(null) }
        );
    }

    return {
        cancellingRideId,
        rideToCancel,
        rideToComplete,
        requestCancel: setRideToCancel,
        requestComplete: setRideToComplete,
        confirmCancel,
        confirmComplete,
        cancelRide,
        completeRide,
    };
}
