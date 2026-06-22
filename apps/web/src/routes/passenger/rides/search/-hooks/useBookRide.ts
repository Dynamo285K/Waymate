import { useNavigate } from "@tanstack/react-router";
import {
    useCreateBooking,
    type CreateBookingInput,
} from "../../../../../features/passenger/hooks/useCreateBooking";
import type { UpcomingRide } from "../../../../../features/passenger/types";

// Wraps the create-booking mutation with the shared "on success, go to my
// rides and hand the booked ride to that page via router state" behaviour.
// Both the all-rides list and the search-results list book the same way and
// only differ in the payload + the booked-ride snapshot, so they pass those in.
export function useBookRide() {
    const navigate = useNavigate();
    const createBooking = useCreateBooking();

    const book = (
        input: CreateBookingInput,
        bookedRide: Omit<UpcomingRide, "id">
    ) => {
        createBooking.mutate(input, {
            onSuccess: (booking) => {
                navigate({
                    to: "/passenger/rides",
                    state: {
                        bookedRide: { id: booking.id, ...bookedRide },
                    },
                });
            },
        });
    };

    return {
        book,
        isError: createBooking.isError,
        error: createBooking.error,
        reset: () => createBooking.reset(),
    };
}
