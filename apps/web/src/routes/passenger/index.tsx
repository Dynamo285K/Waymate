import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HomeContent } from "../../components/shared/HomeContent";
import { useCreateBooking } from "../../features/passenger/hooks/useCreateBooking";
import { BookingErrorModal } from "../../features/passenger/components/BookingErrorModal";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/passenger/")({
    component: PassengerHomePage,
});

function PassengerHomePage() {
    const navigate = useNavigate();
    const { language, theme } = useLayout();
    const createBooking = useCreateBooking();

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <BookingErrorModal
                isError={createBooking.isError}
                error={createBooking.error}
                onClose={() => createBooking.reset()}
            />
            <HomeContent
                language={language}
                onBook={(ride) => {
                    if (
                        !ride.rideId ||
                        !ride.pickupStopId ||
                        !ride.dropoffStopId
                    ) {
                        return;
                    }

                    createBooking.mutate(
                        {
                            rideId: ride.rideId,
                            pickupStopId: ride.pickupStopId,
                            dropoffStopId: ride.dropoffStopId,
                        },
                        {
                            onSuccess: (booking) => {
                                navigate({
                                    to: "/passenger/rides",
                                    state: {
                                        bookedRide: {
                                            id: booking.id,
                                            rideId: ride.rideId,
                                            pickupStopId: ride.pickupStopId,
                                            dropoffStopId: ride.dropoffStopId,
                                            from: ride.from,
                                            to: ride.to,
                                            date: ride.date.toISOString(),
                                            price: ride.price,
                                            driverName: ride.driverName,
                                            driverRating: ride.driverRating,
                                            seatsLeft: ride.seatsLeft,
                                            status: "pending",
                                        },
                                    },
                                });
                            },
                        }
                    );
                }}
                onSearch={(from, to, date, seats) => {
                    navigate({
                        to: "/passenger/rides/search",
                        search: {
                            startLat: from?.lat,
                            startLng: from?.lng,
                            startCity: from?.city || from?.address,
                            destLat: to?.lat,
                            destLng: to?.lng,
                            destCity: to?.city || to?.address,
                            date: date?.toISOString(),
                            seats,
                        },
                    });
                }}
                onViewAllRides={() =>
                    navigate({ to: "/passenger/rides/search" })
                }
            />
        </div>
    );
}
