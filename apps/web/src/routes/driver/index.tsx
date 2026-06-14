import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, FeatureCard, PlusIcon } from "@waymate/ui";
import { CancelRideDialog } from "../../components/shared/CancelRideDialog";
import { CompleteRideDialog } from "../../features/driver/components/CompleteRideDialog";
import { DriverNavbar } from "../../components/navigation/DriverNavbar";
import { RideCard } from "../../components/shared/RideCard";
import { RideRequestCard } from "../../features/driver/components/RideRequestCard";
import {
    formatRideDate as formatDate,
    formatDuration,
} from "../../lib/date-format";
import {
    useGetRidesMe,
    usePatchRidesByIdComplete,
    getGetRidesMeQueryKey,
} from "../../api-client/rides/rides";
import { useCancelRide } from "../../features/driver/hooks/useCancelRide";
import { useDriverNavbarProps } from "../../features/driver/hooks/useDriverNavbarProps";
import { getErrorI18nKey } from "../../lib/api-errors";
import type { ApiMutationError } from "../../lib/api-fetcher";
import {
    useAcceptRideRequest,
    useDeclineRideRequest,
    useDriverRideRequests,
} from "../../features/driver/hooks/useDriverRideRequests";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/driver/")({
    beforeLoad: requireAudience(["user"]),
    component: DriverHomePage,
});

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

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}
function CoinsIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle
                cx="8"
                cy="8"
                r="6"
            />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="m16.71 13.88.7.71-2.82 2.82" />
        </svg>
    );
}
function LeafIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
    );
}
function MessageIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
function BoltIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}
function StarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

export function DriverHomePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const navbarProps = useDriverNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const {
        data: rides,
        isLoading,
        isError,
        error: ridesError,
    } = useGetRidesMe({
        timeframe: "UPCOMING",
    });
    const queryClient = useQueryClient();
    const cancelRide = useCancelRide();
    const [rideToCancel, setRideToCancel] = useState<string | null>(null);
    const [rideToComplete, setRideToComplete] = useState<string | null>(null);
    const completeRide = usePatchRidesByIdComplete<ApiMutationError>({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesMeQueryKey(),
                });
            },
        },
    });
    const {
        data: rideRequests,
        isLoading: areRequestsLoading,
        isError: areRequestsError,
        error: requestsError,
    } = useDriverRideRequests();
    const acceptRequest = useAcceptRideRequest();
    const declineRequest = useDeclineRideRequest();

    const upcomingRides =
        rides?.slice(0, 3).map((ride) => {
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

            return {
                id: ride.id,
                from,
                to,
                date: new Date(ride.departureAt),
                price: ride.prices[0]?.amount ?? 0,
                seatsLeft:
                    remainingSeats > 0 ? remainingSeats : ("full" as const),
                rideStatus: ride.rideStatus,
                duration: formatDuration(
                    ride.departureAt,
                    ride.arrivalEstimateAt
                ),
            };
        }) ?? [];

    const requests =
        rideRequests?.slice(0, 3).map((request) => {
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

    const rideLabels = {
        seatsLeft: (count: number) =>
            t("home.availableRides.seatsLeft", { count }),
        viewPassengers: t("driverRides.viewPassengers"),
        completeRide: t("driverRides.completeRide"),
        cancelRide: t("driver.home.cancelRide"),
    };

    const requestLabels = {
        seatsRequired: (count: number) =>
            t("driver.home.seatsRequired", { count }),
        accept: t("driver.home.accept"),
        decline: t("driver.home.decline"),
    };

    function handleAcceptRequest(bookingId: string) {
        if (acceptRequest.isPending || declineRequest.isPending) return;
        acceptRequest.mutate({ bookingId });
    }

    function handleDeclineRequest(bookingId: string) {
        if (acceptRequest.isPending || declineRequest.isPending) return;
        declineRequest.mutate({ bookingId });
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />

            {/* Hero */}
            <section className="flex flex-col items-center pt-16 sm:pt-24 pb-12 px-4 text-center">
                <h1 className="text-4xl sm:text-5xl font-black text-(--color-text-primary) tracking-tight">
                    {t("driver.home.title")}
                </h1>
                <p className="mt-3 text-lg text-(--color-text-secondary)">
                    {t("driver.home.subtitle")}
                </p>
                <Button
                    variant="outlineSuccess"
                    rightIcon={<PlusIcon />}
                    onClick={() => navigate({ to: "/driver/offer" })}
                    className="mt-8"
                >
                    {t("driver.home.createRide")}
                </Button>
            </section>

            <div className="w-full px-4 sm:max-w-4xl sm:mx-auto sm:px-8 flex flex-col gap-10 pb-12">
                {/* Upcoming Rides */}
                <div>
                    <h2 className="text-xl font-bold text-(--color-text-primary) mb-4">
                        {t("driver.home.upcomingRides")}
                    </h2>
                    <div className="flex flex-col gap-3">
                        {isLoading && (
                            <p className="text-(--color-text-secondary)">
                                {t("driverRides.loading")}
                            </p>
                        )}
                        {isError && (
                            <p className="text-(--color-text-secondary)">
                                {t(
                                    getErrorI18nKey(
                                        ridesError,
                                        {},
                                        "driverRides.error"
                                    )
                                )}
                            </p>
                        )}
                        {!isLoading &&
                            !isError &&
                            upcomingRides.length === 0 && (
                                <p className="text-(--color-text-secondary)">
                                    {t("driverRides.noResults")}
                                </p>
                            )}
                        {!isLoading &&
                            !isError &&
                            upcomingRides.map((ride) => (
                                <RideCard
                                    key={ride.id}
                                    variant="driver-upcoming"
                                    from={ride.from}
                                    to={ride.to}
                                    datetime={formatDate(
                                        ride.date,
                                        t("home.at")
                                    )}
                                    price={ride.price}
                                    seatsLeft={ride.seatsLeft}
                                    duration={ride.duration}
                                    onViewPassengers={() =>
                                        navigate({
                                            to: "/driver/rides/passengers",
                                            state: { ride },
                                        })
                                    }
                                    onCompleteRide={
                                        ride.rideStatus !== "COMPLETED" &&
                                        ride.date <= new Date()
                                            ? () => setRideToComplete(ride.id)
                                            : undefined
                                    }
                                    onCancelRide={
                                        ride.rideStatus !== "COMPLETED"
                                            ? () => setRideToCancel(ride.id)
                                            : undefined
                                    }
                                    labels={rideLabels}
                                />
                            ))}
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
                    </div>
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="outlineSuccess"
                            onClick={() => navigate({ to: "/driver/rides" })}
                        >
                            {t("driver.home.viewAllRides")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Ride Requests */}
            <div className="border-t border-(--color-border)">
                <div className="w-full px-4 sm:max-w-4xl sm:mx-auto sm:px-8 py-10">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("driver.home.rideRequests")}
                    </h2>
                    <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                        {t("driver.home.rideRequestsSubtitle")}
                    </p>
                    <div className="flex flex-col gap-3">
                        {areRequestsLoading && (
                            <p className="text-(--color-text-secondary)">
                                {t("driverRides.loading")}
                            </p>
                        )}
                        {areRequestsError && (
                            <p className="text-(--color-text-secondary)">
                                {t(
                                    getErrorI18nKey(
                                        requestsError,
                                        {},
                                        "rideRequests.error"
                                    )
                                )}
                            </p>
                        )}
                        {(acceptRequest.isError || declineRequest.isError) && (
                            <p className="text-(--color-text-secondary)">
                                {t(
                                    getErrorI18nKey(
                                        acceptRequest.error ??
                                            declineRequest.error,
                                        {},
                                        "rideRequests.actionError"
                                    )
                                )}
                            </p>
                        )}
                        {!areRequestsLoading &&
                            !areRequestsError &&
                            requests.length === 0 && (
                                <p className="text-(--color-text-secondary)">
                                    {t("rideRequests.empty")}
                                </p>
                            )}
                        {!areRequestsLoading &&
                            !areRequestsError &&
                            requests.map((request) => (
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
                                    onAccept={() =>
                                        handleAcceptRequest(request.id)
                                    }
                                    onDecline={() =>
                                        handleDeclineRequest(request.id)
                                    }
                                    labels={requestLabels}
                                />
                            ))}
                    </div>
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="outlineSuccess"
                            onClick={() => navigate({ to: "/driver/requests" })}
                        >
                            {t("driver.home.viewAllRequests")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Features */}
            <section className="bg-(--color-background) border-t border-(--color-border) py-16 px-4">
                <div className="w-full sm:max-w-5xl sm:mx-auto text-center">
                    <h2 className="text-2xl sm:text-4xl font-black text-(--color-text-primary)">
                        {t("home.features.title")}
                    </h2>
                    <p className="mt-2 text-(--color-text-secondary)">
                        {t("home.features.subtitle")}
                    </p>
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-success-bg)"
                                    color="text-(--color-success-text)"
                                >
                                    <ShieldIcon />
                                </IconBox>
                            }
                            title={t("home.features.verifiedDrivers.title")}
                            description={t(
                                "home.features.verifiedDrivers.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-success-bg)"
                                    color="text-(--color-success-text)"
                                >
                                    <CoinsIcon />
                                </IconBox>
                            }
                            title={t("home.features.fairPricing.title")}
                            description={t(
                                "home.features.fairPricing.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-primary)/10"
                                    color="text-(--color-primary)"
                                >
                                    <LeafIcon />
                                </IconBox>
                            }
                            title={t("home.features.ecoFriendly.title")}
                            description={t(
                                "home.features.ecoFriendly.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-primary)/10"
                                    color="text-(--color-primary)"
                                >
                                    <MessageIcon />
                                </IconBox>
                            }
                            title={t("home.features.directChat.title")}
                            description={t(
                                "home.features.directChat.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-warning-bg)"
                                    color="text-(--color-warning-text)"
                                >
                                    <BoltIcon />
                                </IconBox>
                            }
                            title={t("home.features.fastBooking.title")}
                            description={t(
                                "home.features.fastBooking.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-danger-bg)"
                                    color="text-(--color-danger-text)"
                                >
                                    <StarIcon />
                                </IconBox>
                            }
                            title={t("home.features.ratings.title")}
                            description={t("home.features.ratings.description")}
                        />
                    </div>
                </div>
            </section>

            <CancelRideDialog
                open={rideToCancel !== null}
                loading={cancelRide.isPending}
                onOpenChange={(open) => {
                    if (!open) setRideToCancel(null);
                }}
                onConfirm={(reason) => {
                    if (!rideToCancel) return;
                    cancelRide.mutate(
                        { rideId: rideToCancel, reason },
                        { onSettled: () => setRideToCancel(null) }
                    );
                }}
            />

            <CompleteRideDialog
                open={rideToComplete !== null}
                loading={completeRide.isPending}
                onOpenChange={(open) => {
                    if (!open) setRideToComplete(null);
                }}
                onConfirm={() => {
                    if (!rideToComplete) return;
                    completeRide.mutate(
                        { id: rideToComplete, data: {} },
                        { onSettled: () => setRideToComplete(null) }
                    );
                }}
            />
        </div>
    );
}
