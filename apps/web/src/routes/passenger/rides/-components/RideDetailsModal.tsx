import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
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

// One "label above value" card — the same look as the saved-car Car Details
// boxes on the offer-ride page — reused for every scalar fact in this modal.
function InfoCard({
    label,
    children,
    className,
}: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`py-3 px-4 rounded-xl border border-border bg-background${className ? ` ${className}` : ""}`}
        >
            <p className="m-0 text-badge font-bold uppercase tracking-badge text-text-secondary">
                {label}
            </p>
            <div className="mt-1 text-sm font-semibold text-text-primary break-words">
                {children}
            </div>
        </div>
    );
}

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
    const duration = data
        ? formatDuration(data.ride.departureAt, data.ride.arrivalEstimateAt)
        : undefined;

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <div className="w-full min-w-0 sm:min-w-lg max-w-2xl p-5 sm:p-6 max-h-modal-body overflow-y-auto">
                <div className="flex items-center justify-between gap-4 mb-4">
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
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
                            <InfoCard label={t("rideDetails.pickup")}>
                                {pickupCity}
                            </InfoCard>
                            <InfoCard label={t("rideDetails.dropoff")}>
                                {dropoffCity}
                            </InfoCard>
                            <InfoCard label={t("rideDetails.departure")}>
                                {formatRideDate(
                                    new Date(data.ride.departureAt),
                                    t("home.at")
                                )}
                            </InfoCard>
                            {duration && (
                                <InfoCard label={t("rideDetails.duration")}>
                                    {duration}
                                </InfoCard>
                            )}

                            <div className="col-span-full py-3 px-4 rounded-xl border border-border bg-background">
                                <p className="m-0 text-badge font-bold uppercase tracking-badge text-text-secondary mb-2">
                                    {t("rideDetails.driver")}
                                </p>
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        name={driverName}
                                        src={
                                            data.driver.profilePhotoUrl ??
                                            undefined
                                        }
                                        size="sm"
                                    />
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-sm font-semibold text-text-primary break-words">
                                            {driverName}
                                        </span>
                                        <div className="flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0">
                                            <StarIcon />
                                            <span className="text-xs text-text-secondary">
                                                {data.driver.averageRating !==
                                                null
                                                    ? `${data.driver.averageRating.toFixed(1)} (${data.driver.reviewCount})`
                                                    : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-full py-3 px-4 rounded-xl border border-border bg-background">
                                <p className="m-0 text-badge font-bold uppercase tracking-badge text-text-secondary">
                                    {t("rideDetails.vehicle")}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-text-primary break-words">
                                    {data.car.brand} {data.car.modelName}
                                </p>
                                <p className="mt-0.5 text-sm text-text-secondary break-words">
                                    {colorKey
                                        ? t(colorKey)
                                        : t("rideDetails.unknownColor")}
                                    {" • "}
                                    {data.car.spz}
                                </p>
                            </div>
                        </div>

                        <div className="py-3 px-4 rounded-xl border border-border bg-background">
                            <p className="m-0 text-badge font-bold uppercase tracking-badge text-text-secondary mb-2">
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
                                    variant="red"
                                    className="justify-center"
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
