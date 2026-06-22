import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { DriverNavbar } from "../../components/navigation/DriverNavbar";
import { RideRequestCard } from "../../features/driver/components/RideRequestCard";
import { useDriverNavbarProps } from "../../features/driver/hooks/useDriverNavbarProps";
import { getErrorI18nKey } from "../../lib/api-errors";
import { formatRideDate as formatDate } from "../../lib/date-format";
import {
    useAcceptRideRequest,
    useDeclineRideRequest,
    useDriverRideRequests,
} from "../../features/driver/hooks/useDriverRideRequests";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/driver/requests")({
    beforeLoad: requireAudience(["user"]),
    component: DriverRideRequestsPage,
});

export function DriverRideRequestsPage() {
    const { t } = useTranslation();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const navbarProps = useDriverNavbarProps({
        activeTab: "ride-requests",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const {
        data: requests,
        isLoading,
        isError,
        error,
    } = useDriverRideRequests();
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
                name: fullName || t("rideRequests.passenger"),
                rating: request.passenger.averageRating ?? 0,
                seatsRequired: request.seatCount,
                price: request.priceAmount,
                currency: request.currency,
                from: request.requestedPickupCity ?? request.pickupCity,
                to: request.requestedDropoffCity ?? request.dropoffCity,
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
            className="min-h-screen bg-background"
        >
            <DriverNavbar {...navbarProps} />
            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("rideRequests.title")}
                </h1>
                <p className="text-text-secondary mt-1 mb-8">
                    {t("rideRequests.subtitle")}
                </p>
                <div className="flex flex-col gap-4">
                    {isLoading && (
                        <p className="text-text-secondary text-center py-12">
                            {t("driverRides.loading")}
                        </p>
                    )}
                    {isError && (
                        <p className="text-text-secondary text-center py-12">
                            {t(
                                getErrorI18nKey(error, {}, "rideRequests.error")
                            )}
                        </p>
                    )}
                    {(acceptRequest.isError || declineRequest.isError) && (
                        <p className="text-text-secondary text-center">
                            {t(
                                getErrorI18nKey(
                                    acceptRequest.error ?? declineRequest.error,
                                    {},
                                    "rideRequests.actionError"
                                )
                            )}
                        </p>
                    )}
                    {!isLoading &&
                        !isError &&
                        displayedRequests.length === 0 && (
                            <p className="text-text-secondary text-center py-12">
                                {t("rideRequests.empty")}
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
                                price={request.price}
                                currency={request.currency}
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
