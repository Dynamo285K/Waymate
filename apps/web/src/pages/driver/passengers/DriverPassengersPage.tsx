import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "../../../lib/router-compat";
import { StatCard, TextLink } from "@waymate/ui";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../../../components/navigation/DriverNavbar";
import { PassengerCard } from "../components/PassengerCard";
import { CancelRideDialog } from "../../../components/CancelRideDialog";
import { ReportUserModal } from "../../../components/ReportUserModal";
import { useGetRidesByIdPassengers } from "../../../api-client/rides/rides";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { useCancelBookingByDriver } from "./hooks/useCancelBookingByDriver";
import { getErrorI18nKey } from "../../../lib/api-errors";

type DriverPassengersPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

function UsersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle
                cx="9"
                cy="7"
                r="4"
            />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

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

export function DriverPassengersPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: DriverPassengersPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const navbarProps = useDriverNavbarProps({
        activeTab: "my-rides",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const location = useLocation();
    const ride = (
        location.state as {
            ride?: { id: string; from: string; to: string; datetime?: string };
        } | null
    )?.ride;
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
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <div className="text-sm mb-4">
                    <TextLink
                        variant="muted"
                        onClick={() => navigate("/driver/rides")}
                    >
                        {t("driverRides.backToMyRides")}
                    </TextLink>
                </div>

                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-2">
                    {t("driverRides.passengers")}
                </h1>

                {ride && (
                    <div className="text-(--color-text-secondary) text-sm mb-6">
                        {ride.from} → {ride.to}
                    </div>
                )}

                <div className="mb-6">
                    <StatCard
                        icon={
                            <IconBox
                                bg="bg-(--color-primary)/10"
                                color="text-(--color-primary)"
                            >
                                <UsersIcon />
                            </IconBox>
                        }
                        value={String(passengersView?.passengerCount ?? 0)}
                        label={t("driverRides.passengers")}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    {!ride?.id && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.passengersError")}
                        </p>
                    )}

                    {isLoading && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.loading")}
                        </p>
                    )}

                    {isError && (
                        <p className="text-(--color-text-secondary)">
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
                        <p className="text-(--color-text-secondary)">
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
                            <p className="text-(--color-text-secondary)">
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
                                    rating={0}
                                    seatsReserved={booking.seatCount}
                                    onSendMessage={() =>
                                        navigate("/driver/chat")
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
