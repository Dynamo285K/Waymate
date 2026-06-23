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
import { useSubmitReview } from "../../../hooks/shared/useSubmitReview";
import type { UpcomingRide } from "../../../features/passenger/types";
import { useLayout } from "../../../lib/use-layout";
import { PassengerRideList } from "./-components/PassengerRideList";
import {
    mapBookingsToRides,
    type DisplayedRide,
} from "./-lib/passenger-ride-view";

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
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [ratingDriverName, setRatingDriverName] = useState("");
    const [ratingDriverId, setRatingDriverId] = useState("");
    const [ratingRideId, setRatingRideId] = useState("");
    const submitReview = useSubmitReview();
    const [reportTarget, setReportTarget] = useState<{
        driverId: string;
        driverName: string;
        rideId: string;
    } | null>(null);
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

    const handleReport = (ride: DisplayedRide) => {
        if (!ride.driverId || !ride.rideId) return;
        setReportTarget({
            driverId: ride.driverId,
            driverName: ride.driverName,
            rideId: ride.rideId,
        });
    };

    const handleRateDriver = (ride: DisplayedRide) => {
        if (ride.alreadyReviewed) return;
        setRatingDriverName(ride.driverName);
        setRatingDriverId(ride.driverId ?? "");
        setRatingRideId(ride.rideId ?? "");
        setRatingModalOpen(true);
    };

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
                        onRateDriver={handleRateDriver}
                        onReport={handleReport}
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
                open={ratingModalOpen}
                onOpenChange={setRatingModalOpen}
                driverName={ratingDriverName}
                theme={theme}
                title={t("rateDriver.title")}
                submitLabel={t("rateDriver.submit")}
                placeholder={t("rateDriver.placeholder")}
                isSubmitting={submitReview.isPending}
                onSubmit={({ rating, review }) => {
                    if (!ratingDriverId || !ratingRideId) return;
                    submitReview.mutate(
                        {
                            data: {
                                rideId: ratingRideId,
                                subjectId: ratingDriverId,
                                rating,
                                comment: review || undefined,
                            },
                        },
                        {
                            onSuccess: () => {
                                setRatingModalOpen(false);
                                submitReview.reset();
                            },
                        }
                    );
                }}
            />

            {reportTarget && (
                <ReportUserModal
                    key={`${reportTarget.driverId}-${reportTarget.rideId}`}
                    targetUserId={reportTarget.driverId}
                    targetName={reportTarget.driverName}
                    rideId={reportTarget.rideId}
                    onClose={() => setReportTarget(null)}
                />
            )}
        </div>
    );
}
