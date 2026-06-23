import { useState } from "react";
import { useSubmitReview } from "../../../../hooks/shared/useSubmitReview";
import type { DisplayedRide } from "../-lib/passenger-ride-view";

/**
 * Owns the "rate the driver" modal: which ride/driver is being rated, whether
 * the modal is open, and submitting the review. Keeps this orchestration state
 * out of the route component so the page is a lean wiring layer. The rating and
 * comment fields themselves live inside `RateDriverModal`, not here.
 */
export function useRateDriverFlow() {
    const [isOpen, setIsOpen] = useState(false);
    const [driverName, setDriverName] = useState("");
    const [driverId, setDriverId] = useState("");
    const [rideId, setRideId] = useState("");
    const submitReview = useSubmitReview();

    function openFor(ride: DisplayedRide) {
        if (ride.alreadyReviewed) return;
        setDriverName(ride.driverName);
        setDriverId(ride.driverId ?? "");
        setRideId(ride.rideId ?? "");
        setIsOpen(true);
    }

    function submit(rating: number, review: string) {
        if (!driverId || !rideId) return;
        submitReview.mutate(
            {
                data: {
                    rideId,
                    subjectId: driverId,
                    rating,
                    comment: review || undefined,
                },
            },
            {
                onSuccess: () => {
                    setIsOpen(false);
                    submitReview.reset();
                },
            }
        );
    }

    return {
        isOpen,
        setIsOpen,
        driverName,
        openFor,
        submit,
        isSubmitting: submitReview.isPending,
    };
}
