import { useTranslation } from "react-i18next";
import { DriverNavbar, RideRequestCard } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { formatRideDate as formatDate } from "../lib/date-format";
import {
    useAcceptRideRequest,
    useDeclineRideRequest,
    useDriverRideRequests,
} from "../hooks/useDriverRideRequests";

type Props = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (l: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function DriverRideRequestsPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: Props) {
    const { t } = useTranslation();
    const navbarProps = useDriverNavbarProps({
        activeTab: "ride-requests",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const { data: requests, isLoading, isError } = useDriverRideRequests();
    const acceptRequest = useAcceptRideRequest();
    const declineRequest = useDeclineRideRequest();

    const requestLabels = {
        seatsRequired: (count: number) =>
            t("rideRequests.seatsRequired", { count }),
        accept: t("rideRequests.accept"),
        decline: t("rideRequests.decline"),
    };

    const displayedRequests =
        requests?.map((request) => {
            const fullName = [
                request.passenger.firstName,
                request.passenger.lastName,
            ]
                .filter(Boolean)
                .join(" ");

            return {
                id: request.id,
                name: fullName || t("rideRequests.passenger", "Passenger"),
                rating: request.passenger.averageRating ?? 0,
                seatsRequired: request.seatCount,
                from: request.pickupCity,
                to: request.dropoffCity,
                date: new Date(request.departureAt),
            };
        }) ?? [];

    function handleAccept(bookingId: string) {
        if (acceptRequest.isPending || declineRequest.isPending) return;
        acceptRequest.mutate({ bookingId });
    }

    function handleDecline(bookingId: string) {
        if (acceptRequest.isPending || declineRequest.isPending) return;
        declineRequest.mutate({ bookingId });
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />
            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("rideRequests.title")}
                </h1>
                <p className="text-(--color-text-secondary) mt-1 mb-8">
                    {t("rideRequests.subtitle")}
                </p>
                <div className="flex flex-col gap-4">
                    {isLoading && (
                        <p className="text-(--color-text-secondary) text-center py-12">
                            {t("driverRides.loading")}
                        </p>
                    )}
                    {isError && (
                        <p className="text-(--color-text-secondary) text-center py-12">
                            {t(
                                "rideRequests.error",
                                "Failed to load ride requests. Please try again."
                            )}
                        </p>
                    )}
                    {(acceptRequest.isError || declineRequest.isError) && (
                        <p className="text-(--color-text-secondary) text-center">
                            {t(
                                "rideRequests.actionError",
                                "Could not update the request. Please try again."
                            )}
                        </p>
                    )}
                    {!isLoading &&
                        !isError &&
                        displayedRequests.length === 0 && (
                            <p className="text-(--color-text-secondary) text-center py-12">
                                {t(
                                    "rideRequests.empty",
                                    "No pending requests."
                                )}
                            </p>
                        )}
                    {!isLoading &&
                        !isError &&
                        displayedRequests.map((request) => (
                            <RideRequestCard
                                key={request.id}
                                name={request.name}
                                rating={request.rating}
                                seatsRequired={request.seatsRequired}
                                from={request.from}
                                to={request.to}
                                datetime={formatDate(
                                    request.date,
                                    t("home.at")
                                )}
                                onAccept={() => handleAccept(request.id)}
                                onDecline={() => handleDecline(request.id)}
                                labels={requestLabels}
                            />
                        ))}
                </div>
            </section>
        </div>
    );
}
