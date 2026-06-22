import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, PlusIcon } from "@waymate/ui";
import { CancelRideDialog } from "../../components/shared/CancelRideDialog";
import { CompleteRideDialog } from "../../features/driver/components/CompleteRideDialog";
import { DriverNavbar } from "../../components/navigation/DriverNavbar";
import {
    usePatchRidesByIdComplete,
    getGetRidesMeQueryKey,
} from "../../api-client/rides/rides";
import { useCancelRide } from "../../features/driver/hooks/useCancelRide";
import { useDriverNavbarProps } from "../../features/driver/hooks/useDriverNavbarProps";
import type { ApiMutationError } from "../../lib/api-fetcher";
import {
    useAcceptRideRequest,
    useDeclineRideRequest,
} from "../../features/driver/hooks/useDriverRideRequests";
import {
    useDriverDashboardData,
    type DriverUpcomingRide,
} from "../../features/driver/hooks/useDriverDashboardData";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";
import { UpcomingRidesSection } from "./-home/components/UpcomingRidesSection";
import { RideRequestsSection } from "./-home/components/RideRequestsSection";
import { HomeFeaturesSection } from "../../components/shared/HomeFeaturesSection";

export const Route = createFileRoute("/driver/")({
    beforeLoad: requireAudience(["user"]),
    component: DriverHomePage,
});

function DriverHomePage() {
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

    const { upcomingRides, requests, ridesQuery, requestsQuery } =
        useDriverDashboardData();
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
    const acceptRequest = useAcceptRideRequest();
    const declineRequest = useDeclineRideRequest();

    function handleAcceptRequest(bookingId: string) {
        if (acceptRequest.isPending || declineRequest.isPending) return;
        acceptRequest.mutate({ bookingId });
    }

    function handleDeclineRequest(bookingId: string) {
        if (acceptRequest.isPending || declineRequest.isPending) return;
        declineRequest.mutate({ bookingId });
    }

    function handleViewPassengers(ride: DriverUpcomingRide) {
        navigate({ to: "/driver/rides/passengers", state: { ride } });
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

            <UpcomingRidesSection
                rides={upcomingRides}
                isLoading={ridesQuery.isLoading}
                isError={ridesQuery.isError}
                error={ridesQuery.error}
                cancelIsError={cancelRide.isError}
                cancelError={cancelRide.error}
                onViewPassengers={handleViewPassengers}
                onCompleteRide={setRideToComplete}
                onCancelRide={setRideToCancel}
                onViewAll={() => navigate({ to: "/driver/rides" })}
            />

            <RideRequestsSection
                requests={requests}
                isLoading={requestsQuery.isLoading}
                isError={requestsQuery.isError}
                error={requestsQuery.error}
                actionIsError={acceptRequest.isError || declineRequest.isError}
                actionError={acceptRequest.error ?? declineRequest.error}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
                onViewAll={() => navigate({ to: "/driver/requests" })}
            />

            <HomeFeaturesSection
                sectionClassName="bg-(--color-background) border-t border-(--color-border) py-16 px-4"
                gridClassName="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left"
            />

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
