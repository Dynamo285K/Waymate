import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    createFileRoute,
    useLocation,
    useNavigate,
} from "@tanstack/react-router";
import { passengerRidesSearchSchema } from "../../../lib/passenger-rides-search-schema";
import { Button, RateDriverModal } from "@waymate/ui";
import { useOpenConversation } from "../../../features/chat/hooks/useOpenConversation";
import { ReportUserModal } from "../../../components/shared/ReportUserModal";
import {
    useGetBookingsMe,
    getGetBookingsMeQueryOptions,
} from "../../../api-client/bookings/bookings";
import { CancelRideDialog } from "../../../components/shared/CancelRideDialog";
import { useCancelBooking } from "../../../features/passenger/hooks/useCancelBooking";
import type { UpcomingRide } from "../../../features/passenger/types";
import { useLayout } from "../../../lib/use-layout";
import { PassengerRideList } from "./-components/PassengerRideList";
import {
    mapBookingsToRides,
    type DisplayedRide,
} from "./-lib/passenger-ride-view";
import { useRateDriverFlow } from "./-hooks/useRateDriverFlow";
import { useReportDriverFlow } from "./-hooks/useReportDriverFlow";

export const Route = createFileRoute("/passenger/rides/")({
    validateSearch: passengerRidesSearchSchema,
    // Warm the React Query cache from the router loader so the fetch starts
    // before the component mounts (parallel loading, no render waterfall).
    // The component still reads the same query via useGetBookingsMe.
    loaderDeps: ({ search }) => ({ tab: search.tab }),
    loader: ({ context: { queryClient }, deps: { tab } }) =>
        queryClient.ensureQueryData(
            getGetBookingsMeQueryOptions({
                timeframe: tab === "past" ? "PAST" : "UPCOMING",
            })
        ),
    component: PassengerMyRidesPage,
});

function PassengerMyRidesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { theme } = useLayout();
    const search = Route.useSearch();
    const location = useLocation();
    const { openConversation } = useOpenConversation("/passenger/chat");
    const [tab, setTab] = useState(search.tab === "past" ? "past" : "upcoming");
    const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
    const cancelBooking = useCancelBooking();
    const rateFlow = useRateDriverFlow();
    const reportFlow = useReportDriverFlow();
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

    const incomingBooked = location.state.bookedRide;
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

    const bookingRides = mapBookingsToRides(bookings);
    const displayedRides: DisplayedRide[] =
        tab === "upcoming" && optimisticRide
            ? [
                  optimisticRide,
                  ...(bookingRides ?? []).filter(
                      (ride) => ride.id !== optimisticRide.id
                  ),
              ]
            : (bookingRides ?? []);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <section className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h1 className="text-2xl font-bold text-text-primary mb-6">
                    {t("myRides.title")}
                </h1>

                <div className="flex gap-2">
                    <Button
                        variant={tab === "upcoming" ? "black" : "secondary"}
                        onClick={() => {
                            setTab("upcoming");
                            void navigate({
                                to: "/passenger/rides",
                                search: { tab: "upcoming" },
                            });
                        }}
                    >
                        {t("myRides.upcoming")}
                    </Button>
                    <Button
                        variant={tab === "past" ? "black" : "secondary"}
                        onClick={() => {
                            setTab("past");
                            void navigate({
                                to: "/passenger/rides",
                                search: { tab: "past" },
                            });
                        }}
                    >
                        {t("myRides.past")}
                    </Button>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                    <PassengerRideList
                        isLoading={isLoading}
                        isError={isError}
                        error={error}
                        tab={tab === "past" ? "past" : "upcoming"}
                        rides={displayedRides}
                        onSendMessage={(rideId) => openConversation(rideId)}
                        onCancelBooking={(rideId) => setBookingToCancel(rideId)}
                        onRateDriver={rateFlow.openFor}
                        onReport={reportFlow.openFor}
                    />
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
                open={rateFlow.isOpen}
                onOpenChange={rateFlow.setIsOpen}
                driverName={rateFlow.driverName}
                theme={theme}
                title={t("rateDriver.title")}
                submitLabel={t("rateDriver.submit")}
                placeholder={t("rateDriver.placeholder")}
                isSubmitting={rateFlow.isSubmitting}
                onSubmit={({ rating, review }) =>
                    rateFlow.submit(rating, review)
                }
            />

            {reportFlow.target && (
                <ReportUserModal
                    key={`${reportFlow.target.driverId}-${reportFlow.target.rideId}`}
                    targetUserId={reportFlow.target.driverId}
                    targetName={reportFlow.target.driverName}
                    rideId={reportFlow.target.rideId}
                    onClose={reportFlow.close}
                />
            )}
        </div>
    );
}
