import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { PassengerNavbar } from "../../../components/navigation/PassengerNavbar";
import { usePassengerNavbarProps } from "../../../hooks/shared/usePassengerNavbarProps";
import { useGetRidesAvailable } from "../../../api-client/rides/rides";
import { useRideSearch } from "../../../hooks/shared/useRideSearch";
import { BookingErrorModal } from "../../../features/passenger/components/BookingErrorModal";
import { rideSearchSchema } from "../../../lib/ride-search-schema";
import { authClient } from "../../../lib/auth-client";
import { getDisplayName } from "../../../lib/session-user";
import { requireAudience } from "../../../lib/route-guards";
import { useLayout } from "../../../lib/use-layout";
import { useBookRide } from "./-search/hooks/useBookRide";
import { RideSearchStatus } from "./-search/components/RideSearchStatus";
import { AllRidesList } from "./-search/components/AllRidesList";
import { SearchResultsList } from "./-search/components/SearchResultsList";

export const Route = createFileRoute("/passenger/rides/search")({
    beforeLoad: requireAudience(["user"]),
    validateSearch: rideSearchSchema,
    component: PassengerRidesPage,
});

function PassengerRidesPage() {
    const { t } = useTranslation();
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
    const search = Route.useSearch();
    const book = useBookRide();

    const startLat = search.startLat ?? null;
    const startLng = search.startLng ?? null;
    const startCity = search.startCity ?? null;
    const destLat = search.destLat ?? null;
    const destLng = search.destLng ?? null;
    const destCity = search.destCity ?? null;
    const dateStr = search.date ?? null;
    const seats = search.seats ?? 1;

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

    const availableRides = Array.isArray(availableRideRows)
        ? availableRideRows
        : [];
    const displayedRides = rides ?? [];
    const count = showAllRides ? availableRides.length : displayedRides.length;

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <PassengerNavbar {...navbarProps} />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h2 className="text-2xl font-bold text-text-primary">
                    {t("home.availableRides.title")}
                </h2>

                <RideSearchStatus
                    showAllRides={showAllRides}
                    hasSearchParams={hasSearchParams}
                    canSearch={canSearch}
                    count={count}
                    areAvailableRidesLoading={areAvailableRidesLoading}
                    areAvailableRidesError={areAvailableRidesError}
                    availableRidesError={availableRidesError}
                    isLoading={isLoading}
                    isError={isError}
                    searchError={searchError}
                />

                <BookingErrorModal
                    isError={book.isError}
                    error={book.error}
                    onClose={() => book.reset()}
                />

                {canSearch &&
                    !isLoading &&
                    !isError &&
                    displayedRides.length === 0 && (
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
                        <AllRidesList
                            rows={availableRides}
                            seats={seats}
                            book={book.book}
                        />
                    )}

                {!showAllRides && displayedRides.length > 0 && (
                    <SearchResultsList
                        rides={displayedRides}
                        seats={seats}
                        startCity={startCity}
                        destCity={destCity}
                        book={book.book}
                    />
                )}
            </section>
        </div>
    );
}
