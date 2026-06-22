import { useTranslation } from "react-i18next";
import { RideCard } from "../../../../components/shared/RideCard";
import { formatRideDate } from "../../../../lib/date-format";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import type { UpcomingRide } from "../-lib/driver-profile";

export function UpcomingRidesColumn({
    rides,
    loading,
    ridesError,
    cancelIsError,
    cancelError,
    cancelPending,
    cancellingRideId,
    onViewPassengers,
    onCancelRide,
}: {
    rides: UpcomingRide[];
    loading: boolean;
    ridesError: unknown;
    cancelIsError: boolean;
    cancelError: unknown;
    cancelPending: boolean;
    cancellingRideId: string | null;
    onViewPassengers: (ride: UpcomingRide) => void;
    onCancelRide: (rideId: string) => void;
}) {
    const { t } = useTranslation();
    const hasError = Boolean(ridesError);

    return (
        <div className="flex-1 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-text-primary">
                {t("profile.myUpcomingRides")}
            </h2>
            {loading && (
                <p className="text-text-secondary">
                    {t("driverRides.loading")}
                </p>
            )}

            {hasError && (
                <p className="text-text-secondary">
                    {t(getErrorI18nKey(ridesError, {}, "driverRides.error"))}
                </p>
            )}

            {cancelIsError && (
                <p className="text-text-secondary">
                    {t(
                        getErrorI18nKey(
                            cancelError,
                            {},
                            "driverRides.cancelError"
                        )
                    )}
                </p>
            )}

            {!loading && !hasError && rides.length === 0 && (
                <p className="text-text-secondary">
                    {t("driverRides.noResults")}
                </p>
            )}

            {!loading &&
                !hasError &&
                rides.map((ride) => {
                    const isCancelling =
                        cancelPending && cancellingRideId === ride.id;

                    return (
                        <RideCard
                            key={ride.id}
                            variant="driver-upcoming"
                            from={ride.from}
                            to={ride.to}
                            datetime={formatRideDate(
                                new Date(ride.date),
                                t("home.at")
                            )}
                            price={ride.price}
                            seatsLeft={ride.seatsLeft}
                            duration={ride.duration}
                            onViewPassengers={() => onViewPassengers(ride)}
                            onCancelRide={() => onCancelRide(ride.id)}
                            labels={{
                                seatsLeft: (count) =>
                                    t("driverRides.seatsLeft", { count }),
                                full: t("driverRides.full"),
                                viewPassengers: t("driverRides.viewPassengers"),
                                cancelRide: isCancelling
                                    ? t("driverRides.cancelling")
                                    : t("profile.cancelRide"),
                            }}
                        />
                    );
                })}
        </div>
    );
}
