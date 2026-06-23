import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import { CancelRideDialog } from "../../../components/shared/CancelRideDialog";
import { CompleteRideDialog } from "../../../features/driver/components/CompleteRideDialog";
import {
    useGetRidesMe,
    usePatchRidesByIdComplete,
    getGetRidesMeQueryKey,
} from "../../../api-client/rides/rides";
import { useCancelRide } from "../../../features/driver/hooks/useCancelRide";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { driverRidesSearchSchema } from "../../../lib/driver-rides-search-schema";
import type { ApiMutationError } from "../../../lib/api-fetcher";
import { useLayout } from "../../../lib/use-layout";
import { DriverRideList } from "./-components/DriverRideList";
import {
    mapRidesToDisplayed,
    type DriverDisplayedRide,
} from "./-lib/driver-ride-view";

export const Route = createFileRoute("/driver/rides/")({
    validateSearch: driverRidesSearchSchema,
    component: DriverMyRidesPage,
});

function DriverMyRidesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { theme } = useLayout();
    const search = Route.useSearch();
    const [tab, setTab] = useState(search.tab === "past" ? "past" : "upcoming");
    const [cancellingRideId, setCancellingRideId] = useState<string | null>(
        null
    );
    const [rideToCancel, setRideToCancel] = useState<string | null>(null);
    const [rideToComplete, setRideToComplete] = useState<string | null>(null);
    const timeframe = tab === "past" ? "PAST" : "UPCOMING";
    const {
        data: rides,
        isLoading,
        isError,
        error,
    } = useGetRidesMe({ timeframe });
    const cancelRide = useCancelRide();
    const completeRide = usePatchRidesByIdComplete<ApiMutationError>({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetRidesMeQueryKey(),
                });
            },
        },
    });

    const displayedRides = mapRidesToDisplayed(rides);

    function handleViewPassengers(ride: DriverDisplayedRide) {
        void navigate({
            to: "/driver/rides/passengers",
            state: { ride },
        });
    }

    function handleRatePassengers(ride: DriverDisplayedRide) {
        void navigate({
            to: "/driver/rides/rate",
            state: { ride },
        });
    }

    function handleConfirmCancel(reason: string) {
        if (!rideToCancel) return;
        setCancellingRideId(rideToCancel);
        setRideToCancel(null);
        cancelRide.mutate(
            { rideId: rideToCancel, reason },
            { onSettled: () => setCancellingRideId(null) }
        );
    }

    function handleConfirmComplete() {
        if (!rideToComplete) return;
        completeRide.mutate(
            { id: rideToComplete, data: {} },
            { onSettled: () => setRideToComplete(null) }
        );
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <section className="w-full px-4 sm:max-w-4xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h1 className="text-2xl font-bold text-text-primary mb-6">
                    {t("driverRides.title")}
                </h1>

                <div className="flex gap-2 mb-6">
                    <Button
                        variant={tab === "upcoming" ? "black" : "secondary"}
                        onClick={() => {
                            setTab("upcoming");
                            void navigate({
                                to: "/driver/rides",
                                search: { tab: "upcoming" },
                            });
                        }}
                    >
                        {t("driverRides.upcoming")}
                    </Button>
                    <Button
                        variant={tab === "past" ? "black" : "secondary"}
                        onClick={() => {
                            setTab("past");
                            void navigate({
                                to: "/driver/rides",
                                search: { tab: "past" },
                            });
                        }}
                    >
                        {t("driverRides.past")}
                    </Button>
                </div>

                <div className="flex flex-col gap-4">
                    {cancelRide.isError && (
                        <p className="text-text-secondary">
                            {t(
                                getErrorI18nKey(
                                    cancelRide.error,
                                    {},
                                    "driverRides.cancelError"
                                )
                            )}
                        </p>
                    )}

                    {completeRide.isError && (
                        <p className="text-text-secondary">
                            {t(
                                getErrorI18nKey(
                                    completeRide.error,
                                    {},
                                    "driverRides.completeError"
                                )
                            )}
                        </p>
                    )}

                    <DriverRideList
                        isLoading={isLoading}
                        isError={isError}
                        error={error}
                        tab={tab === "past" ? "past" : "upcoming"}
                        rides={displayedRides}
                        cancellingRideId={cancellingRideId}
                        isCancelPending={cancelRide.isPending}
                        isCompletePending={completeRide.isPending}
                        rideToComplete={rideToComplete}
                        onViewPassengers={handleViewPassengers}
                        onCompleteRide={(rideId) => setRideToComplete(rideId)}
                        onCancelRide={(rideId) => setRideToCancel(rideId)}
                        onRatePassengers={handleRatePassengers}
                    />
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

            <CompleteRideDialog
                open={rideToComplete !== null}
                loading={completeRide.isPending}
                onOpenChange={(open) => {
                    if (!open) setRideToComplete(null);
                }}
                onConfirm={handleConfirmComplete}
            />
        </div>
    );
}
