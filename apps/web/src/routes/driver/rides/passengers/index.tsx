import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    createFileRoute,
    useNavigate,
    useLocation,
} from "@tanstack/react-router";
import { StatCard, TextLink, UsersIcon } from "@waymate/ui";
import { PassengerCard } from "../../../../features/driver/components/PassengerCard";
import { useOpenConversation } from "../../../../features/chat/hooks/useOpenConversation";
import { CancelRideDialog } from "../../../../components/shared/CancelRideDialog";
import { ReportUserModal } from "../../../../components/shared/ReportUserModal";
import { useGetRidesByIdPassengers } from "../../../../api-client/rides/rides";
import { useCancelBookingByDriver } from "./-hooks/useCancelBookingByDriver";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { useLayout } from "../../../../lib/use-layout";

export const Route = createFileRoute("/driver/rides/passengers/")({
    component: DriverPassengersPage,
});

function StatVisual({ children }: { children: React.ReactNode }) {
    const toneClass =
        "bg-primary/10 text-primary icon-svg:text-primary icon-svg:stroke-current";

    return (
        <div
            className={`w-full h-full ${toneClass} rounded-xl flex items-center justify-center`}
        >
            {children}
        </div>
    );
}

function DriverPassengersPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { openConversation } = useOpenConversation("/driver/chat");
    const { theme } = useLayout();
    const location = useLocation();
    const ride = location.state.ride;
    const {
        data: passengersView,
        isLoading,
        isError,
        error,
    } = useGetRidesByIdPassengers(ride?.id ?? "", {
        query: { enabled: Boolean(ride?.id) },
    });
    const cancelBooking = useCancelBookingByDriver();
    const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

    const [reportTarget, setReportTarget] = useState<{
        userId: string;
        name: string;
    } | null>(null);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <div className="text-sm mb-4">
                    <TextLink
                        variant="muted"
                        onClick={() => navigate({ to: "/driver/rides" })}
                    >
                        {t("driverRides.backToMyRides")}
                    </TextLink>
                </div>

                <h1 className="text-2xl font-bold text-text-primary mb-2">
                    {t("driverRides.passengers")}
                </h1>

                {ride && (
                    <div className="text-text-secondary text-sm mb-6">
                        {ride.from} → {ride.to}
                    </div>
                )}

                <div className="mb-6">
                    <StatCard
                        icon={
                            <StatVisual>
                                <UsersIcon />
                            </StatVisual>
                        }
                        value={String(passengersView?.passengerCount ?? 0)}
                        label={t("driverRides.passengers")}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    {!ride?.id && (
                        <p className="text-text-secondary">
                            {t("driverRides.passengersError")}
                        </p>
                    )}

                    {isLoading && (
                        <p className="text-text-secondary">
                            {t("driverRides.loading")}
                        </p>
                    )}

                    {isError && (
                        <p className="text-text-secondary">
                            {t(
                                getErrorI18nKey(
                                    error,
                                    {},
                                    "driverRides.passengersError"
                                )
                            )}
                        </p>
                    )}

                    {cancelBooking.isError && (
                        <p className="text-text-secondary">
                            {t(
                                getErrorI18nKey(
                                    cancelBooking.error,
                                    {},
                                    "driverRides.cancelBookingError"
                                )
                            )}
                        </p>
                    )}

                    {!isLoading &&
                        !isError &&
                        passengersView?.passengers.length === 0 && (
                            <p className="text-text-secondary">
                                {t("driverRides.noPassengers")}
                            </p>
                        )}

                    {!isLoading &&
                        !isError &&
                        passengersView?.passengers.map((booking) => {
                            const passengerName =
                                `${booking.passenger.firstName ?? ""} ${
                                    booking.passenger.lastName ?? ""
                                }`.trim() || t("roles.passenger");

                            return (
                                <PassengerCard
                                    key={booking.bookingId}
                                    name={passengerName}
                                    rating={
                                        booking.passenger.averageRating ?? 0
                                    }
                                    seatsReserved={booking.seatCount}
                                    from={
                                        booking.requestedPickupCity ??
                                        booking.pickupStop?.city ??
                                        undefined
                                    }
                                    to={
                                        booking.requestedDropoffCity ??
                                        booking.dropoffStop?.city ??
                                        undefined
                                    }
                                    onSendMessage={() =>
                                        openConversation(booking.bookingId)
                                    }
                                    onCancelBooking={() =>
                                        setBookingToCancel(booking.bookingId)
                                    }
                                    onReport={() =>
                                        setReportTarget({
                                            userId: booking.passenger.id,
                                            name: passengerName,
                                        })
                                    }
                                    labels={{
                                        seatsReserved: (count) =>
                                            t("driverRides.seatsReserved", {
                                                count,
                                            }),
                                        sendMessage: t(
                                            "driverRides.sendMessage"
                                        ),
                                        cancelBooking: t(
                                            "driverRides.cancelBooking"
                                        ),
                                        reportUser: t("report.action"),
                                    }}
                                />
                            );
                        })}
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
                    cancelBooking.mutate({
                        bookingId: bookingToCancel,
                        rideId: ride?.id,
                        reason: reason || undefined,
                    });
                    setBookingToCancel(null);
                }}
                title={t("cancelBookingDriverDialog.title")}
                message={t("cancelBookingDriverDialog.message")}
                reasonRequired
            />

            {reportTarget && (
                <ReportUserModal
                    key={reportTarget.userId}
                    targetUserId={reportTarget.userId}
                    targetName={reportTarget.name}
                    rideId={ride?.id}
                    onClose={() => setReportTarget(null)}
                />
            )}
        </div>
    );
}
