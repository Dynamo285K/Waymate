import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import { CancelRideDialog } from "../../../components/shared/CancelRideDialog";
import { CompleteRideDialog } from "../../../features/driver/components/CompleteRideDialog";
import {
    useGetRidesMe,
    getGetRidesMeQueryOptions,
} from "../../../api-client/rides/rides";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { driverRidesSearchSchema } from "../../../lib/driver-rides-search-schema";
import { useLayout } from "../../../lib/use-layout";
import { DriverRideList } from "./-components/DriverRideList";
import {
    mapRidesToDisplayed,
    type DriverDisplayedRide,
} from "./-lib/driver-ride-view";
import { useDriverRideActions } from "./-hooks/useDriverRideActions";

export const Route = createFileRoute("/driver/rides/")({
    validateSearch: driverRidesSearchSchema,
    // Warm the React Query cache from the router loader so the fetch starts
    // before the component mounts (parallel loading, no render waterfall).
    // The component still reads the same query via useGetRidesMe.
    loaderDeps: ({ search }) => ({ tab: search.tab }),
    loader: ({ context: { queryClient }, deps: { tab } }) =>
        queryClient.ensureQueryData(
            getGetRidesMeQueryOptions({
                timeframe: tab === "past" ? "PAST" : "UPCOMING",
            })
        ),
    component: DriverMyRidesPage,
});

function DriverMyRidesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { theme } = useLayout();
    const search = Route.useSearch();
    const [tab, setTab] = useState(search.tab === "past" ? "past" : "upcoming");
    const timeframe = tab === "past" ? "PAST" : "UPCOMING";
    const {
        data: rides,
        isLoading,
        isError,
        error,
    } = useGetRidesMe({ timeframe });
    const actions = useDriverRideActions();
    const { cancelRide, completeRide } = actions;

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
                        cancellingRideId={actions.cancellingRideId}
                        isCancelPending={cancelRide.isPending}
                        isCompletePending={completeRide.isPending}
                        rideToComplete={actions.rideToComplete}
                        onViewPassengers={handleViewPassengers}
                        onCompleteRide={actions.requestComplete}
                        onCancelRide={actions.requestCancel}
                        onRatePassengers={handleRatePassengers}
                    />
                </div>
            </section>

            <CancelRideDialog
                open={actions.rideToCancel !== null}
                loading={cancelRide.isPending}
                onOpenChange={(open) => {
                    if (!open) actions.requestCancel(null);
                }}
                onConfirm={actions.confirmCancel}
            />

            <CompleteRideDialog
                open={actions.rideToComplete !== null}
                loading={completeRide.isPending}
                onOpenChange={(open) => {
                    if (!open) actions.requestComplete(null);
                }}
                onConfirm={actions.confirmComplete}
            />
        </div>
    );
}
