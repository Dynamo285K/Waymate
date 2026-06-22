import { useTranslation } from "react-i18next";
import { Button } from "@waymate/ui";
import { RideCard } from "../../../../components/shared/RideCard";
import { formatRideDate as formatDate } from "../../../../lib/date-format";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import type { DriverUpcomingRide } from "../../../../features/driver/hooks/useDriverDashboardData";

type UpcomingRidesSectionProps = {
    rides: DriverUpcomingRide[];
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    cancelIsError: boolean;
    cancelError: unknown;
    onViewPassengers: (ride: DriverUpcomingRide) => void;
    onCompleteRide: (rideId: string) => void;
    onCancelRide: (rideId: string) => void;
    onViewAll: () => void;
};

export function UpcomingRidesSection({
    rides,
    isLoading,
    isError,
    error,
    cancelIsError,
    cancelError,
    onViewPassengers,
    onCompleteRide,
    onCancelRide,
    onViewAll,
}: UpcomingRidesSectionProps) {
    const { t } = useTranslation();

    const rideLabels = {
        seatsLeft: (count: number) =>
            t("home.availableRides.seatsLeft", { count }),
        viewPassengers: t("driverRides.viewPassengers"),
        completeRide: t("driverRides.completeRide"),
        cancelRide: t("driver.home.cancelRide"),
    };

    return (
        <div className="w-full px-4 sm:max-w-4xl sm:mx-auto sm:px-8 flex flex-col gap-10 pb-12">
            <div>
                <h2 className="text-xl font-bold text-(--color-text-primary) mb-4">
                    {t("driver.home.upcomingRides")}
                </h2>
                <div className="flex flex-col gap-3">
                    {isLoading && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.loading")}
                        </p>
                    )}
                    {isError && (
                        <p className="text-(--color-text-secondary)">
                            {t(getErrorI18nKey(error, {}, "driverRides.error"))}
                        </p>
                    )}
                    {!isLoading && !isError && rides.length === 0 && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.noResults")}
                        </p>
                    )}
                    {!isLoading &&
                        !isError &&
                        rides.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="driver-upcoming"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatDate(ride.date, t("home.at"))}
                                price={ride.price}
                                seatsLeft={ride.seatsLeft}
                                duration={ride.duration}
                                onViewPassengers={() => onViewPassengers(ride)}
                                onCompleteRide={
                                    ride.rideStatus !== "COMPLETED" &&
                                    ride.date <= new Date()
                                        ? () => onCompleteRide(ride.id)
                                        : undefined
                                }
                                onCancelRide={
                                    ride.rideStatus !== "COMPLETED"
                                        ? () => onCancelRide(ride.id)
                                        : undefined
                                }
                                labels={rideLabels}
                            />
                        ))}
                    {cancelIsError && (
                        <p className="text-(--color-text-secondary)">
                            {t(
                                getErrorI18nKey(
                                    cancelError,
                                    {},
                                    "driverRides.cancelError"
                                )
                            )}
                        </p>
                    )}
                </div>
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outlineSuccess"
                        onClick={onViewAll}
                    >
                        {t("driver.home.viewAllRides")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
