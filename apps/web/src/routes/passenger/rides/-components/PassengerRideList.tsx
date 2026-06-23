import { useTranslation } from "react-i18next";
import { RideCard } from "../../../../components/shared/RideCard";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { formatRideDate } from "../../../../lib/date-format";
import type { DisplayedRide } from "../-lib/passenger-ride-view";

export type PassengerRideListProps = {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    tab: "upcoming" | "past";
    rides: DisplayedRide[];
    onSendMessage: (rideId: string) => void;
    onCancelBooking: (rideId: string) => void;
    onRateDriver: (ride: DisplayedRide) => void;
    onReport: (ride: DisplayedRide) => void;
};

/** Renders the passenger My-rides list (loading/error/empty + ride cards). */
export function PassengerRideList({
    isLoading,
    isError,
    error,
    tab,
    rides,
    onSendMessage,
    onCancelBooking,
    onRateDriver,
    onReport,
}: PassengerRideListProps) {
    const { t } = useTranslation();

    const labels = {
        seatsLeft: (count: number) => t("myRides.seatsLeft", { count }),
        pendingConfirmation: t("myRides.pendingConfirmation"),
        cancelBooking: t("myRides.cancelBooking"),
        rateDriver: t("myRides.rateDriver"),
        rated: t("myRides.rated"),
        reportDriver: t("myRides.reportDriver"),
        messageDriver: t("myRides.messageDriver"),
    };

    const formatDatetime = (date: Date | string) =>
        formatRideDate(
            typeof date === "string" ? new Date(date) : date,
            t("home.at")
        );

    const reportHandler = (ride: DisplayedRide) =>
        ride.driverId && ride.rideId ? () => onReport(ride) : undefined;

    if (isLoading) {
        return <p className="text-text-secondary">{t("myRides.loading")}</p>;
    }

    if (isError) {
        return (
            <p className="text-text-secondary">
                {t(getErrorI18nKey(error, {}, "myRides.error"))}
            </p>
        );
    }

    if (rides.length === 0) {
        return <p className="text-text-secondary">{t("myRides.noResults")}</p>;
    }

    if (tab === "upcoming") {
        return (
            <>
                {rides.map((ride) => (
                    <RideCard
                        key={ride.id}
                        variant="passenger-upcoming"
                        from={ride.from}
                        to={ride.to}
                        datetime={formatDatetime(ride.date)}
                        price={ride.price}
                        duration={ride.duration}
                        driverName={ride.driverName}
                        driverRating={ride.driverRating}
                        seatsLeft={ride.seatsLeft}
                        status={ride.status}
                        onSendMessage={() => onSendMessage(String(ride.id))}
                        onCancelBooking={() => onCancelBooking(String(ride.id))}
                        onReport={reportHandler(ride)}
                        labels={labels}
                    />
                ))}
            </>
        );
    }

    return (
        <>
            {rides.map((ride) => (
                <RideCard
                    key={ride.id}
                    variant="passenger-past"
                    from={ride.from}
                    to={ride.to}
                    datetime={formatDatetime(ride.date)}
                    price={ride.price}
                    duration={ride.duration}
                    driverName={ride.driverName}
                    driverRating={ride.driverRating}
                    alreadyReviewed={ride.alreadyReviewed}
                    onRateDriver={() => onRateDriver(ride)}
                    onReport={reportHandler(ride)}
                    labels={labels}
                />
            ))}
        </>
    );
}
