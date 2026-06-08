import { useNavigate } from "../../../lib/router-compat";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { PassengerNavbar } from "../../../components/navigation/PassengerNavbar";
import { HomeContent } from "../../../components/shared/HomeContent";
import { usePassengerNavbarProps } from "../../../hooks/shared/usePassengerNavbarProps";
import { useCreateBooking } from "../hooks/useCreateBooking";
import { BookingErrorModal } from "../components/BookingErrorModal";

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
                    if (from) {
                        params.set("startLat", String(from.lat));
                        params.set("startLng", String(from.lng));
                        const city = from.city || from.address;
                        if (city) params.set("startCity", city);
                    }
                    if (to) {
                        params.set("destLat", String(to.lat));
                        params.set("destLng", String(to.lng));
                        const city = to.city || to.address;
                        if (city) params.set("destCity", city);
                    }
                    if (date) params.set("date", date.toISOString());
                    navigate(`/passenger/rides/search?${params.toString()}`);
                }}
                onViewAllRides={() => navigate("/passenger/rides/search")}
            />
        </div>
    );
}
