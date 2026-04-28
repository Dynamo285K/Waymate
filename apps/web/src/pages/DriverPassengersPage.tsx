import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "../lib/router-compat";
import { DriverNavbar, PassengerCard, StatCard } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useRidePassengers } from "../hooks/useRidePassengers";
import { toUiLanguage } from "../lib/language";
import { useLogout } from "../hooks/useLogout";
import { useCancelBookingByDriver } from "../hooks/useCancelBookingByDriver";

type DriverPassengersPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

function UsersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle
                cx="9"
                cy="7"
                r="4"
            />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function IconBox({
    bg,
    color,
    children,
}: {
    bg: string;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`w-full h-full ${bg} ${color} rounded-xl flex items-center justify-center`}
        >
            {children}
        </div>
    );
}

export function DriverPassengersPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: DriverPassengersPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const logout = useLogout();
    const location = useLocation();
    const ride = (
        location.state as {
            ride?: { id: string; from: string; to: string; datetime?: string };
        } | null
    )?.ride;
    const {
        data: passengersView,
        isLoading,
        isError,
    } = useRidePassengers(ride?.id);
    const cancelBooking = useCancelBookingByDriver();

    const navbarLabels = {
        passenger: t("roles.passenger"),
        driver: t("roles.driver"),
        offerRide: t("driver.nav.offerRide"),
        myRides: t("driver.nav.myRides"),
        rideRequests: t("driver.nav.rideRequests"),
        chat: t("driver.nav.chat"),
        profile: t("nav.profile"),
        dropdownMyRides: t("driver.nav.myRides"),
        messages: t("nav.messages"),
        ratings: t("nav.ratings"),
        settings: t("nav.settings"),
        logout: t("nav.logout"),
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar
                activeTab="my-rides"
                language={toUiLanguage(language)}
                onLanguageChange={onLanguageChange}
                role="driver"
                onRoleChange={(r) =>
                    r === "passenger" && navigate("/passenger")
                }
                theme={theme}
                onThemeToggle={onThemeToggle}
                userName={userName}
                userEmail={userEmail}
                onLogoClick={() => navigate("/driver")}
                onOfferRideClick={() => navigate("/driver")}
                onMyRidesClick={() => navigate("/driver/rides")}
                onRideRequestsClick={() => navigate("/driver/requests")}
                onChatClick={() => navigate("/driver/chat")}
                onMessagesClick={() => navigate("/driver/chat")}
                onProfileClick={() => navigate("/driver/profile")}
                onRatingsClick={() => navigate("/driver/ratings?view=authored")}
                onLogoutClick={logout}
                labels={navbarLabels}
            />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <button
                    onClick={() => navigate("/driver/rides")}
                    className="text-(--color-text-secondary) text-sm mb-4 hover:text-(--color-text-primary) transition-colors"
                >
                    {t("driverRides.backToMyRides")}
                </button>

                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-2">
                    {t("driverRides.passengers")}
                </h1>

                {ride && (
                    <div className="text-(--color-text-secondary) text-sm mb-6">
                        {ride.from} → {ride.to}
                    </div>
                )}

                <div className="mb-6">
                    <StatCard
                        icon={
                            <IconBox
                                bg="bg-purple-100"
                                color="text-purple-600"
                            >
                                <UsersIcon />
                            </IconBox>
                        }
                        value={String(passengersView?.passengerCount ?? 0)}
                        label={t("driverRides.passengers")}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    {!ride?.id && (
                        <p className="text-(--color-text-secondary)">
                            {t(
                                "driverRides.passengersError",
                                "Select a ride to view passengers."
                            )}
                        </p>
                    )}

                    {isLoading && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.loading")}
                        </p>
                    )}

                    {isError && (
                        <p className="text-(--color-text-secondary)">
                            {t(
                                "driverRides.passengersError",
                                "Failed to load passengers. Please try again."
                            )}
                        </p>
                    )}

                    {cancelBooking.isError && (
                        <p className="text-(--color-text-secondary)">
                            {t(
                                "driverRides.cancelBookingError",
                                "Failed to cancel booking. Please try again."
                            )}
                        </p>
                    )}

                    {!isLoading &&
                        !isError &&
                        passengersView?.passengers.length === 0 && (
                            <p className="text-(--color-text-secondary)">
                                {t(
                                    "driverRides.noPassengers",
                                    "No passengers yet."
                                )}
                            </p>
                        )}

                    {!isLoading &&
                        !isError &&
                        passengersView?.passengers.map((booking) => {
                            const passengerName =
                                `${booking.passenger.firstName ?? ""} ${
                                    booking.passenger.lastName ?? ""
                                }`.trim() || t("roles.passenger");

                            return (
                                <PassengerCard
                                    key={booking.bookingId}
                                    name={passengerName}
                                    rating={0}
                                    seatsReserved={booking.seatCount}
                                    onSendMessage={() =>
                                        navigate("/driver/chat")
                                    }
                                    onCancelBooking={() =>
                                        cancelBooking.mutate({
                                            bookingId: booking.bookingId,
                                            rideId: ride?.id,
                                            reason: "Driver cancelled passenger booking",
                                        })
                                    }
                                    labels={{
                                        seatsReserved: (count) =>
                                            t("driverRides.seatsReserved", {
                                                count,
                                            }),
                                        sendMessage: t(
                                            "driverRides.sendMessage"
                                        ),
                                        cancelBooking: t(
                                            "driverRides.cancelBooking"
                                        ),
                                    }}
                                />
                            );
                        })}
                </div>
            </section>
        </div>
    );
}
