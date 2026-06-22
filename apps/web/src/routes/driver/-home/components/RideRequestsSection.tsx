import { useTranslation } from "react-i18next";
import { Button } from "@waymate/ui";
import { RideRequestCard } from "../../../../features/driver/components/RideRequestCard";
import { formatRideDate as formatDate } from "../../../../lib/date-format";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import type { DriverRequestViewModel } from "../../../../features/driver/hooks/useDriverDashboardData";

type RideRequestsSectionProps = {
    requests: DriverRequestViewModel[];
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    actionIsError: boolean;
    actionError: unknown;
    onAccept: (bookingId: string) => void;
    onDecline: (bookingId: string) => void;
    onViewAll: () => void;
};

export function RideRequestsSection({
    requests,
    isLoading,
    isError,
    error,
    actionIsError,
    actionError,
    onAccept,
    onDecline,
    onViewAll,
}: RideRequestsSectionProps) {
    const { t } = useTranslation();

    const requestLabels = {
        seatsRequired: (count: number) =>
            t("driver.home.seatsRequired", { count }),
        accept: t("driver.home.accept"),
        decline: t("driver.home.decline"),
    };

    return (
        <div className="border-t border-border">
            <div className="w-full px-4 sm:max-w-4xl sm:mx-auto sm:px-8 py-10">
                <h2 className="text-xl font-bold text-text-primary">
                    {t("driver.home.rideRequests")}
                </h2>
                <p className="text-text-secondary text-sm mt-1 mb-6">
                    {t("driver.home.rideRequestsSubtitle")}
                </p>
                <div className="flex flex-col gap-3">
                    {isLoading && (
                        <p className="text-text-secondary">
                            {t("driverRides.loading")}
                        </p>
                    )}
                    {isError && (
                        <p className="text-text-secondary">
                            {t(
                                getErrorI18nKey(error, {}, "rideRequests.error")
                            )}
                        </p>
                    )}
                    {actionIsError && (
                        <p className="text-text-secondary">
                            {t(
                                getErrorI18nKey(
                                    actionError,
                                    {},
                                    "rideRequests.actionError"
                                )
                            )}
                        </p>
                    )}
                    {!isLoading && !isError && requests.length === 0 && (
                        <p className="text-text-secondary">
                            {t("rideRequests.empty")}
                        </p>
                    )}
                    {!isLoading &&
                        !isError &&
                        requests.map((request) => (
                            <RideRequestCard
                                key={request.id}
                                name={request.name}
                                rating={request.rating}
                                seatsRequired={request.seatsRequired}
                                price={request.price}
                                currency={request.currency}
                                from={request.from}
                                to={request.to}
                                datetime={formatDate(
                                    request.date,
                                    t("home.at")
                                )}
                                onAccept={() => onAccept(request.id)}
                                onDecline={() => onDecline(request.id)}
                                labels={requestLabels}
                            />
                        ))}
                </div>
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outlineSuccess"
                        onClick={onViewAll}
                    >
                        {t("driver.home.viewAllRequests")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
