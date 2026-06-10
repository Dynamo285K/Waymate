import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { Language } from "../../components/controls/LanguageSwitcher";
import { PassengerNavbar } from "../../components/navigation/PassengerNavbar";
import { HomeContent } from "../../components/shared/HomeContent";
import { usePassengerNavbarProps } from "../../hooks/shared/usePassengerNavbarProps";
import { useCreateBooking } from "../../features/passenger/hooks/useCreateBooking";
import { BookingErrorModal } from "../../features/passenger/components/BookingErrorModal";
import { requireAudience } from "../../lib/route-guards";
import { makeAudienceComponent } from "../../lib/make-audience-component";

export const Route = createFileRoute("/passenger/")({
    beforeLoad: requireAudience(["user"]),
    component: makeAudienceComponent(PassengerHomePage),
});

type PassengerHomePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function PassengerHomePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: PassengerHomePageProps) {
    const navigate = useNavigate();
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
            className="min-h-screen bg-(--color-bg)"
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
                onSearch={(from, to, date) => {
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
