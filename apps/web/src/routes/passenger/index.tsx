import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PassengerNavbar } from "../../components/navigation/PassengerNavbar";
import { HomeContent } from "../../components/shared/HomeContent";
import { usePassengerNavbarProps } from "../../hooks/shared/usePassengerNavbarProps";
import { useCreateBooking } from "../../features/passenger/hooks/useCreateBooking";
import { BookingErrorModal } from "../../features/passenger/components/BookingErrorModal";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/passenger/")({
    beforeLoad: requireAudience(["user"]),
    component: PassengerHomePage,
});

export function PassengerHomePage() {
    const navigate = useNavigate();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const navbarProps = usePassengerNavbarProps({
        activeTab: "find-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const createBooking = useCreateBooking();

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <PassengerNavbar {...navbarProps} />
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
