import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "../lib/router-compat";
import { Button, RateDriverModal } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { PassengerNavbar } from "../components/navigation/PassengerNavbar";
import { RideCard } from "../components/RideCard";
import { useGetBookingsMe } from "../api-client/bookings/bookings";
import { getErrorI18nKey } from "../lib/api-errors";
import { formatRideDate } from "../lib/date-format";
import { usePassengerNavbarProps } from "../hooks/usePassengerNavbarProps";
import { CancelRideDialog } from "../components/CancelRideDialog";
import { useCancelBooking } from "../hooks/useCancelBooking";

type PassengerMyRidesPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type UpcomingRide = {
    id: number | string;
    from: string;
    to: string;
    date: Date | string;
    price: number;
    driverName: string;
    driverRating: number;
    seatsLeft: number;
    status: "pending" | "confirmed";
};

export function PassengerMyRidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: PassengerMyRidesPageProps) {
    const { t } = useTranslation();
    const navbarProps = usePassengerNavbarProps({
        activeTab: "my-rides",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const location = useLocation();
    const [tab, setTab] = useState("upcoming");
    const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
    const cancelBooking = useCancelBooking();
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [ratingDriverName, setRatingDriverName] = useState("");
    const [optimisticRide, setOptimisticRide] = useState<UpcomingRide | null>(
        null
    );
    const timeframe = tab === "past" ? "PAST" : "UPCOMING";
    const {
        data: bookings,
        isLoading,
        isError,
        error,
    } = useGetBookingsMe({ timeframe });

    const incomingBooked = (
        location.state as { bookedRide?: UpcomingRide } | null
    )?.bookedRide;
    const [prevLocationState, setPrevLocationState] = useState(location.state);
    if (location.state !== prevLocationState) {
        setPrevLocationState(location.state);
        if (incomingBooked) {
            setOptimisticRide(incomingBooked);
            setTab("upcoming");
        }
    }

    useEffect(() => {
        if (incomingBooked) {
            window.history.replaceState({}, "");
        }
    }, [incomingBooked]);

    const bookingRides = bookings?.map((booking) => ({
        id: booking.id,
        from: booking.pickupCity,
        to: booking.dropoffCity,
        date: booking.ride.departureAt,
        price: booking.priceAmount,
        driverName:
            `${booking.driver.firstName ?? ""} ${booking.driver.lastName ?? ""}`.trim(),
        driverRating: 0,
        seatsLeft: booking.seatsLeft,
        status:
            booking.bookingStatus === "CONFIRMED"
                ? ("confirmed" as const)
                : ("pending" as const),
    }));
    const displayedRides =
        tab === "upcoming" && optimisticRide
            ? [
                  optimisticRide,
                  ...(bookingRides ?? []).filter(
                      (ride) => ride.id !== optimisticRide.id
                  ),
              ]
            : (bookingRides ?? []);

    const rideLabels = {
        seatsLeft: (count: number) => t("myRides.seatsLeft", { count }),
        pendingConfirmation: t("myRides.pendingConfirmation"),
        cancelBooking: t("myRides.cancelBooking"),
        rateDriver: t("myRides.rateDriver"),
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <PassengerNavbar {...navbarProps} />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">
                    {t("myRides.title")}
                </h1>

                <div className="flex gap-2">
                    <Button
                        variant={tab === "upcoming" ? "black" : "secondary"}
                        onClick={() => setTab("upcoming")}
                    >
                        {t("myRides.upcoming")}
                    </Button>
                    <Button
                        variant={tab === "past" ? "black" : "secondary"}
                        onClick={() => setTab("past")}
                    >
                        {t("myRides.past")}
                    </Button>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                    {isLoading && (
                        <p className="text-(--color-text-secondary)">
                            {t("myRides.loading")}
                        </p>
                    )}

                    {isError && (
                        <p className="text-(--color-text-secondary)">
                            {t(getErrorI18nKey(error, {}, "myRides.error"))}
                        </p>
                    )}

                    {!isLoading && !isError && displayedRides.length === 0 && (
                        <p className="text-(--color-text-secondary)">
                            {t("myRides.noResults")}
                        </p>
                    )}

                    {!isLoading &&
                        !isError &&
                        tab === "upcoming" &&
                        displayedRides.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="passenger-upcoming"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatRideDate(
                                    typeof ride.date === "string"
                                        ? new Date(ride.date)
                                        : ride.date,
                                    t("home.at")
                                )}
                                price={ride.price}
                                driverName={ride.driverName}
                                driverRating={ride.driverRating}
                                seatsLeft={ride.seatsLeft}
                                status={ride.status}
                                onCancelBooking={() =>
                                    setBookingToCancel(String(ride.id))
                                }
                                labels={rideLabels}
                            />
                        ))}

                    {!isLoading &&
                        !isError &&
                        tab === "past" &&
                        displayedRides.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="passenger-past"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatRideDate(
                                    typeof ride.date === "string"
                                        ? new Date(ride.date)
                                        : ride.date,
                                    t("home.at")
                                )}
                                price={ride.price}
                                driverName={ride.driverName}
                                driverRating={ride.driverRating}
                                onRateDriver={() => {
                                    setRatingDriverName(ride.driverName);
                                    setRatingModalOpen(true);
                                }}
                                labels={rideLabels}
                            />
                        ))}
                </div>
            </section>

            <CancelRideDialog
                open={bookingToCancel !== null}
                loading={cancelBooking.isPending}
                onOpenChange={(open) => {
                    if (!open) setBookingToCancel(null);
                }}
                onConfirm={(reason) => {
                    if (!bookingToCancel) return;
                    cancelBooking.mutate(bookingToCancel, reason || undefined, {
                        onSettled: () => setBookingToCancel(null),
                    });
                }}
                title={t("cancelBookingDialog.title")}
                message={t("cancelBookingDialog.message")}
            />

            <RateDriverModal
                open={ratingModalOpen}
                onOpenChange={setRatingModalOpen}
                driverName={ratingDriverName}
                title={t("rateDriver.title")}
                submitLabel={t("rateDriver.submit")}
                placeholder={t("rateDriver.placeholder")}
                onSubmit={({ rating, review }) => {
                    console.log("Rating submitted", {
                        driverName: ratingDriverName,
                        rating,
                        review,
                    });
                    setRatingModalOpen(false);
                }}
            />
        </div>
    );
}
