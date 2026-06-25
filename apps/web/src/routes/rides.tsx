import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { AuthNavbarFrame } from "../components/navigation/AuthNavbarFrame";
import { AvailableRideCard } from "../components/shared/AvailableRideCard";
import { GuestBookModal } from "../components/shared/GuestBookModal";
import { useRideSearch } from "../hooks/shared/useRideSearch";
import { useAuthNavbarProps } from "../hooks/shared/useAuthNavbarProps";
import {
    useGetRidesAvailable,
    getGetRidesAvailableQueryOptions,
} from "../api-client/rides/rides";
import { getErrorI18nKey } from "../lib/api-errors";
import { formatRideDate, formatDuration } from "../lib/date-format";
import { mapAvailableRides } from "../lib/available-rides-view";
import { rideSearchSchema } from "../lib/ride-search-schema";
import { requireAudience } from "../lib/route-guards";
import { useLayout } from "../lib/use-layout";

export const Route = createFileRoute("/rides")({
    beforeLoad: requireAudience(["guest", "user"]),
    validateSearch: rideSearchSchema,
    // Warm the React Query cache from the router loader so the default
    // available-rides fetch starts before the component mounts (parallel
    // loading, no render waterfall). The component still reads the same query
    // via useGetRidesAvailable; the search-params query stays in the component
    // because it depends on validated search state.
    loader: ({ context: { queryClient } }) =>
        queryClient.ensureQueryData(getGetRidesAvailableQueryOptions()),
    component: RidesPage,
});

function RidesPage() {
    const { t } = useTranslation();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const authNavbarProps = useAuthNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
    });
    const search = Route.useSearch();
    const [showGuestModal, setShowGuestModal] = useState(false);

    const startLat = search.startLat ?? null;
    const startLng = search.startLng ?? null;
    const startCity = search.startCity ?? null;
    const destLat = search.destLat ?? null;
    const destLng = search.destLng ?? null;
    const destCity = search.destCity ?? null;
    const dateStr = search.date ?? null;

    const hasSearchParams =
        (startLat !== null && startLng !== null) ||
        (destLat !== null && destLng !== null) ||
        !!dateStr;
    const showAllRides = !hasSearchParams;
    const {
        data: availableRideRows,
        isLoading: areAvailableRidesLoading,
        isError: areAvailableRidesError,
        error: availableRidesError,
    } = useGetRidesAvailable();

    const {
        data: rides,
        isLoading,
        isError,
        error: searchError,
        canSearch,
    } = useRideSearch({
        startLat,
        startLng,
        startCity,
        destLat,
        destLng,
        destCity,
        date: dateStr,
    });

    const availableRides = mapAvailableRides(
        availableRideRows,
        t("roles.driver")
    );

    const count = showAllRides ? availableRides.length : (rides?.length ?? 0);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <AuthNavbarFrame {...authNavbarProps} />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h2 className="text-2xl font-bold text-text-primary">
                    {t("home.availableRides.title")}
                </h2>

                {showAllRides && (
                    <p className="text-text-secondary mt-1 mb-8">
                        {t("rides.found", { count })}
                    </p>
                )}

                {showAllRides && areAvailableRidesLoading && (
                    <p className="text-text-secondary mt-1">
                        {t("rides.loading")}
                    </p>
                )}

                {showAllRides && areAvailableRidesError && (
                    <p className="text-text-secondary mt-1">
                        {t(
                            getErrorI18nKey(
                                availableRidesError,
                                {},
                                "rides.error"
                            )
                        )}
                    </p>
                )}

                {hasSearchParams && !canSearch && (
                    <p className="text-text-secondary mt-1">
                        {t("rides.noSearchParams")}
                    </p>
                )}

                {canSearch && isLoading && (
                    <p className="text-text-secondary mt-1">
                        {t("rides.loading")}
                    </p>
                )}

                {canSearch && isError && (
                    <p className="text-text-secondary mt-1">
                        {t(getErrorI18nKey(searchError, {}, "rides.error"))}
                    </p>
                )}

                {canSearch && !isLoading && !isError && (
                    <p className="text-text-secondary mt-1 mb-8">
                        {t("rides.found", { count })}
                    </p>
                )}

                {rides && rides.length === 0 && (
                    <p className="text-text-secondary mt-4">
                        {t("rides.noResults")}
                    </p>
                )}

                {showAllRides &&
                    !areAvailableRidesLoading &&
                    !areAvailableRidesError &&
                    availableRides.length === 0 && (
                        <p className="text-text-secondary mt-4">
                            {t("rides.noResults")}
                        </p>
                    )}

                {showAllRides &&
                    !areAvailableRidesLoading &&
                    !areAvailableRidesError && (
                        <div className="flex flex-col gap-3">
                            {availableRides.map((ride) => (
                                <AvailableRideCard
                                    key={ride.id}
                                    from={ride.from}
                                    to={ride.to}
                                    datetime={formatRideDate(
                                        ride.date,
                                        t("home.at")
                                    )}
                                    duration={ride.duration}
                                    seatsLeft={ride.seatsLeft}
                                    driverName={ride.driverName}
                                    driverRating={ride.driverRating}
                                    price={ride.price}
                                    onBook={() => setShowGuestModal(true)}
                                    labels={{
                                        seatsLeft: (count) =>
                                            t("home.availableRides.seatsLeft", {
                                                count,
                                            }),
                                        book: t("home.availableRides.book"),
                                    }}
                                />
                            ))}
                        </div>
                    )}

                {!showAllRides && rides && rides.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {rides.map((ride) => (
                            <AvailableRideCard
                                key={ride.rideId}
                                from={ride.pickupStop.city}
                                to={ride.dropoffStop.city}
                                datetime={formatRideDate(
                                    new Date(
                                        ride.pickupStop.plannedDepartureAt ??
                                            ride.departureAt
                                    ),
                                    t("home.at")
                                )}
                                duration={formatDuration(
                                    ride.departureAt,
                                    ride.arrivalEstimateAt
                                )}
                                seatsLeft={ride.seatsLeft}
                                driverName={`${ride.driver.firstName} ${ride.driver.lastName}`}
                                driverRating={ride.driver.averageRating ?? 0}
                                price={ride.priceAmount ?? 0}
                                onBook={() => setShowGuestModal(true)}
                                labels={{
                                    seatsLeft: (count) =>
                                        t("home.availableRides.seatsLeft", {
                                            count,
                                        }),
                                    book: t("home.availableRides.book"),
                                }}
                            />
                        ))}
                    </div>
                )}
            </section>

            <GuestBookModal
                open={showGuestModal}
                onClose={() => setShowGuestModal(false)}
            />
        </div>
    );
}
