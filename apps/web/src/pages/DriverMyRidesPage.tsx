import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { Button } from "@waymate/ui";
import { CancelRideDialog } from "../components/CancelRideDialog";
import type { Language } from "../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../components/navigation/DriverNavbar";
import { RideCard } from "../components/RideCard";
import { useGetRidesMe } from "../api-client/rides/rides";
import { useCancelRide } from "../hooks/useCancelRide";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { getErrorI18nKey } from "../lib/api-errors";
import { formatRideDate } from "../lib/date-format";

type DriverMyRidesPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function DriverMyRidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: DriverMyRidesPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const navbarProps = useDriverNavbarProps({
        activeTab: "my-rides",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const [tab, setTab] = useState("upcoming");
    const [cancellingRideId, setCancellingRideId] = useState<string | null>(
        null
    );
    const [rideToCancel, setRideToCancel] = useState<string | null>(null);
    const timeframe = tab === "past" ? "PAST" : "UPCOMING";
    const {
        data: rides,
        isLoading,
        isError,
        error,
    } = useGetRidesMe({ timeframe });
    const cancelRide = useCancelRide();
    const displayedRides =
        rides?.map((ride) => {
            const sortedStops = [...ride.rideStops].sort(
                (a, b) => a.stopOrder - b.stopOrder
            );
            const from = sortedStops[0]?.city ?? "";
            const to = sortedStops[sortedStops.length - 1]?.city ?? "";
            const confirmedSeats = ride.bookings.reduce(
                (sum, booking) => sum + booking.seatCount,
                0
            );
            const remainingSeats = ride.offeredSeats - confirmedSeats;
            const seatsLeft: number | "full" =
                remainingSeats > 0 ? remainingSeats : "full";
            const price = ride.prices[0]?.amount ?? 0;

            return {
                id: ride.id,
                from,
                to,
                date: ride.departureAt,
                price,
                seatsLeft,
            };
        }) ?? [];

    function handleConfirmCancel(reason: string) {
        if (!rideToCancel) return;
        setCancellingRideId(rideToCancel);
        setRideToCancel(null);
        cancelRide.mutate(
            { rideId: rideToCancel, reason },
            { onSettled: () => setCancellingRideId(null) }
        );
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">
                    {t("driverRides.title")}
                </h1>

                <div className="flex gap-2 mb-6">
                    <Button
                        variant={tab === "upcoming" ? "black" : "secondary"}
                        onClick={() => setTab("upcoming")}
                    >
                        {t("driverRides.upcoming")}
                    </Button>
                    <Button
                        variant={tab === "past" ? "black" : "secondary"}
                        onClick={() => setTab("past")}
                    >
                        {t("driverRides.past")}
                    </Button>
                </div>

                <div className="flex flex-col gap-4">
                    {isLoading && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.loading")}
                        </p>
                    )}

                    {isError && (
                        <p className="text-(--color-text-secondary)">
                            {t(getErrorI18nKey(error, {}, "driverRides.error"))}
                        </p>
                    )}

                    {cancelRide.isError && (
                        <p className="text-(--color-text-secondary)">
                            {t(
                                getErrorI18nKey(
                                    cancelRide.error,
                                    {},
                                    "driverRides.cancelError"
                                )
                            )}
                        </p>
                    )}

                    {!isLoading && !isError && displayedRides.length === 0 && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.noResults")}
                        </p>
                    )}

                    {!isLoading &&
                        !isError &&
                        displayedRides.map((ride) => {
                            const isCancelling =
                                cancelRide.isPending &&
                                cancellingRideId === ride.id;

                            return tab === "upcoming" ? (
                                <RideCard
                                    key={ride.id}
                                    variant="driver-upcoming"
                                    from={ride.from}
                                    to={ride.to}
                                    datetime={formatRideDate(
                                        new Date(ride.date),
                                        t("home.at")
                                    )}
                                    price={ride.price}
                                    seatsLeft={ride.seatsLeft}
                                    onViewPassengers={() =>
                                        navigate("/driver/rides/passengers", {
                                            state: { ride },
                                        })
                                    }
                                    onCancelRide={() =>
                                        setRideToCancel(ride.id)
                                    }
                                    labels={{
                                        seatsLeft: (count) =>
                                            t("driverRides.seatsLeft", {
                                                count,
                                            }),
                                        full: t("driverRides.full"),
                                        viewPassengers: t(
                                            "driverRides.viewPassengers"
                                        ),
                                        cancelRide: isCancelling
                                            ? t("driverRides.cancelling")
                                            : t("driverRides.cancelRide"),
                                    }}
                                />
                            ) : (
                                <RideCard
                                    key={ride.id}
                                    variant="driver-past"
                                    from={ride.from}
                                    to={ride.to}
                                    datetime={formatRideDate(
                                        new Date(ride.date),
                                        t("home.at")
                                    )}
                                    price={ride.price}
                                    onRatePassengers={() =>
                                        navigate("/driver/rides/rate", {
                                            state: { ride },
                                        })
                                    }
                                    labels={{
                                        ratePassengers: t(
                                            "driverRides.ratePassengers"
                                        ),
                                    }}
                                />
                            );
                        })}
                </div>
            </section>

            <CancelRideDialog
                open={rideToCancel !== null}
                loading={cancelRide.isPending}
                onOpenChange={(open) => {
                    if (!open) setRideToCancel(null);
                }}
                onConfirm={handleConfirmCancel}
            />
        </div>
    );
}
