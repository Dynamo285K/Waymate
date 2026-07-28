import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { CarIcon } from "@/components/ui/icons/CarIcon";
import { ClockIcon } from "@/components/ui/icons/ClockIcon";
import { CloseIcon } from "@/components/ui/icons/CloseIcon";
import { StarIcon } from "@/components/ui/icons/StarIcon";
import { getCarColorI18nKey, type CarColor } from "@/lib/car-colors";
import { useGetBookingsById } from "../../../../api-client/bookings/bookings";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { formatDuration, formatRideDate } from "../../../../lib/date-format";

type ReportTarget = { driverId: string; driverName: string; rideId: string };

type RideDetailsModalProps = {
    bookingId: string;
    theme?: string;
    onClose: () => void;
    onReportDriver: (target: ReportTarget) => void;
};

const sectionTitleClass =
    "text-badge font-bold uppercase tracking-badge text-text-secondary mb-2";

export function RideDetailsModal({
    bookingId,
    theme,
    onClose,
    onReportDriver,
}: RideDetailsModalProps) {
    const { t } = useTranslation();
    const detailQuery = useGetBookingsById(bookingId);
    const data = detailQuery.data;

    const pickupCity = data?.requestedPickupCity ?? data?.pickupCity;
    const dropoffCity = data?.requestedDropoffCity ?? data?.dropoffCity;
    const colorKey = getCarColorI18nKey(data?.car.color as CarColor | null);
    const driverName = data
        ? `${data.driver.firstName ?? ""} ${data.driver.lastName ?? ""}`.trim()
        : "";

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <div className="w-full min-w-0 max-w-lg p-5 sm:p-8 max-h-modal-body overflow-y-auto">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <h2 className="text-xl font-bold text-text-primary min-w-0 break-words">
                        {t("rideDetails.title")}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<CloseIcon />}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                {detailQuery.isLoading && (
                    <p className="text-text-secondary">
                        {t("rideDetails.loading")}
                    </p>
                )}

                {!detailQuery.isLoading && detailQuery.isError && (
                    <p className="text-danger-text">
                        {t(
                            getErrorI18nKey(
                                detailQuery.error,
                                {},
                                "rideDetails.error"
                            )
                        )}
                    </p>
                )}

                {data && (
                    <div className="flex flex-col gap-5">
                        <div>
                            <p className={sectionTitleClass}>
                                {t("rideDetails.route")}
                            </p>
                            <p className="text-sm font-semibold text-text-primary break-words">
                                {data.originalStartCity} →{" "}
                                {data.originalEndCity}
                            </p>
                            <p className="mt-1 text-sm text-text-secondary break-words">
                                {t("rideDetails.pickup")}: {pickupCity} —{" "}
                                {t("rideDetails.dropoff")}: {dropoffCity}
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-text-secondary icon-svg:w-4 icon-svg:h-4 icon-svg:text-text-secondary icon-svg:shrink-0">
                            <ClockIcon />
                            <span>
                                {formatRideDate(
                                    new Date(data.ride.departureAt),
                                    t("home.at")
                                )}
                            </span>
                            {formatDuration(
                                data.ride.departureAt,
                                data.ride.arrivalEstimateAt
                            ) && (
                                <span>
                                    {" "}
                                    •{" "}
                                    {formatDuration(
                                        data.ride.departureAt,
                                        data.ride.arrivalEstimateAt
                                    )}
                                </span>
                            )}
                        </div>

                        <div>
                            <p className={sectionTitleClass}>
                                {t("rideDetails.driver")}
                            </p>
                            <div className="flex items-center gap-3">
                                <Avatar
                                    name={driverName}
                                    src={
                                        data.driver.profilePhotoUrl ?? undefined
                                    }
                                    size="md"
                                />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-sm font-semibold text-text-primary break-words">
                                        {driverName}
                                    </span>
                                    <div className="flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0">
                                        <StarIcon />
                                        <span className="text-xs text-text-secondary">
                                            {data.driver.averageRating !== null
                                                ? `${data.driver.averageRating.toFixed(1)} (${data.driver.reviewCount})`
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className={sectionTitleClass}>
                                {t("rideDetails.vehicle")}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-text-primary icon-svg:w-4 icon-svg:h-4 icon-svg:text-text-secondary icon-svg:shrink-0">
                                <CarIcon />
                                <span className="font-semibold">
                                    {data.car.brand} {data.car.modelName}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-text-secondary">
                                {colorKey
                                    ? t(colorKey)
                                    : t("rideDetails.unknownColor")}
                                {" • "}
                                {data.car.spz}
                            </p>
                        </div>

                        <div>
                            <p className={sectionTitleClass}>
                                {t("rideDetails.passengers")}
                            </p>
                            {data.coPassengers.length === 0 ? (
                                <p className="text-sm text-text-secondary">
                                    {t("rideDetails.noCoPassengers")}
                                </p>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {data.coPassengers.map((passenger) => (
                                        <li
                                            key={passenger.id}
                                            className="flex items-center gap-2.5"
                                        >
                                            <Avatar
                                                name={`${passenger.firstName ?? ""} ${passenger.lastName ?? ""}`.trim()}
                                                src={
                                                    passenger.profilePhotoUrl ??
                                                    undefined
                                                }
                                                size="sm"
                                            />
                                            <span className="text-sm text-text-primary min-w-0 break-words">
                                                {`${passenger.firstName ?? ""} ${passenger.lastName ?? ""}`.trim()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {data.bookingStatus === "CONFIRMED" && (
                            <div className="flex justify-end pt-1">
                                <Button
                                    variant="secondary"
                                    className="justify-center icon-svg:w-4 icon-svg:h-4"
                                    onClick={() =>
                                        onReportDriver({
                                            driverId: data.driver.id,
                                            driverName,
                                            rideId: data.ride.id,
                                        })
                                    }
                                >
                                    {t("myRides.reportDriver")}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
