import { useNavigate } from "../lib/router-compat";
import { PassengerNavbar } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { HomeContent } from "../components/HomeContent";
import { usePassengerNavbarProps } from "../hooks/usePassengerNavbarProps";
import { useCreateBooking } from "../hooks/useCreateBooking";

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
                                navigate("/passenger/rides", {
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
                    const params = new URLSearchParams();
                    if (from) params.set("from", from);
                    if (to) params.set("to", to);
                    if (date) params.set("date", date.toISOString());
                    navigate(`/passenger/rides/search?${params.toString()}`);
                }}
                onViewAllRides={() => navigate("/passenger/rides/search")}
            />
        </div>
    );
}
