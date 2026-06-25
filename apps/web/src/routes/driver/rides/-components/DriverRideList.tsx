import { useTranslation } from "react-i18next";
import { RideCard } from "../../../../components/shared/RideCard";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { formatRideDate } from "../../../../lib/date-format";
import type { DriverDisplayedRide } from "../-lib/driver-ride-view";

export type DriverRideListProps = {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    tab: "upcoming" | "past";
    rides: DriverDisplayedRide[];
    cancellingRideId: string | null;
    isCancelPending: boolean;
    isCompletePending: boolean;
    rideToComplete: string | null;
    onViewPassengers: (ride: DriverDisplayedRide) => void;
    onCompleteRide: (rideId: string) => void;
    onCancelRide: (rideId: string) => void;
    onRatePassengers: (ride: DriverDisplayedRide) => void;
};

/** Renders the driver My-rides list (loading/error/empty + ride cards). */
export function DriverRideList({
    isLoading,
    isError,
    error,
    tab,
    rides,
    cancellingRideId,
    isCancelPending,
    isCompletePending,
    rideToComplete,
    onViewPassengers,
    onCompleteRide,
    onCancelRide,
    onRatePassengers,
}: DriverRideListProps) {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <p className="text-text-secondary">{t("driverRides.loading")}</p>
        );
    }

    if (isError) {
        return (
            <p className="text-text-secondary">
                {t(getErrorI18nKey(error, {}, "driverRides.error"))}
            </p>
        );
    }

    if (rides.length === 0) {
        return (
            <p className="text-text-secondary">{t("driverRides.noResults")}</p>
        );
    }

    return (
        <>
            {rides.map((ride) => {
                const datetime = formatRideDate(
                    new Date(ride.date),
                    t("home.at")
                );

                if (tab === "past") {
                    return (
                        <RideCard
                            key={ride.id}
                            variant="driver-past"
                            from={ride.from}
                            to={ride.to}
                            datetime={datetime}
                            price={ride.price}
                            duration={ride.duration}
                            onRatePassengers={() => onRatePassengers(ride)}
                            labels={{
                                ratePassengers: t("driverRides.ratePassengers"),
                            }}
                        />
                    );
                }

                const isCancelling =
                    isCancelPending && cancellingRideId === ride.id;
                const isCompleting =
                    isCompletePending && rideToComplete === null;
                const isActive = ride.rideStatus !== "COMPLETED";
                const hasDeparted = new Date(ride.date) <= new Date();

                return (
                    <RideCard
                        key={ride.id}
                        variant="driver-upcoming"
                        from={ride.from}
                        to={ride.to}
                        datetime={datetime}
                        price={ride.price}
                        seatsLeft={ride.seatsLeft}
                        duration={ride.duration}
                        onViewPassengers={() => onViewPassengers(ride)}
                        onCompleteRide={
                            isActive && hasDeparted
                                ? () => onCompleteRide(ride.id)
                                : undefined
                        }
                        onCancelRide={
                            isActive ? () => onCancelRide(ride.id) : undefined
                        }
                        labels={{
                            seatsLeft: (count) =>
                                t("driverRides.seatsLeft", { count }),
                            full: t("driverRides.full"),
                            viewPassengers: t("driverRides.viewPassengers"),
                            completeRide: isCompleting
                                ? t("driverRides.completing")
                                : t("driverRides.completeRide"),
                            cancelRide: isCancelling
                                ? t("driverRides.cancelling")
                                : t("driverRides.cancelRide"),
                        }}
                    />
                );
            })}
        </>
    );
}
