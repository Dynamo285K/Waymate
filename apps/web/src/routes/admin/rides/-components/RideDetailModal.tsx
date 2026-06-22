import { useTranslation } from "react-i18next";
import { Avatar, Button, CloseIcon, IconButton, Modal } from "@waymate/ui";
import { useGetAdminRidesById } from "../../../../api-client/admin/admin";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminRidesErrorMap } from "../-lib/admin-ride-errors";
import {
    fullName,
    formatDate,
    formatPrice,
} from "../../../../features/admin/lib/admin-format";
import { RideStatusBadge } from "./RideStatusBadge";
import { RideStatusHistoryEntry } from "./RideStatusHistoryEntry";

type RideDetailModalProps = {
    theme: "light" | "dark";
    rideId: string;
    isThisRideMutating: boolean;
    mutationErrorForThisRide: unknown;
    onClose: () => void;
    onRequestCancel: () => void;
};

export function RideDetailModal({
    theme,
    rideId,
    isThisRideMutating,
    mutationErrorForThisRide,
    onClose,
    onRequestCancel,
}: RideDetailModalProps) {
    const { t } = useTranslation();
    const detailQuery = useGetAdminRidesById(rideId);

    const labelClass =
        "text-xs font-bold text-text-secondary tracking-wider mb-1 block";

    const data = detailQuery.data;
    const driverName = data
        ? fullName(data.ride.driver.firstName, data.ride.driver.lastName) ||
          data.ride.driver.email
        : "";

    const originStop = data?.ride.stops[0];
    const destinationStop = data?.ride.stops[data.ride.stops.length - 1];
    const route = data
        ? `${originStop?.city ?? "—"} → ${destinationStop?.city ?? "—"}`
        : "";

    const carLabel = data
        ? [data.ride.car.brand, data.ride.car.modelName]
              .filter(Boolean)
              .join(" ") || data.ride.car.spz
        : "";

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <div className="w-modal-viewport max-w-3xl p-8 max-h-modal-body overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-text-primary">
                        {t("admin.rideDetail")}
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
                        {t("admin.loadingRides")}
                    </p>
                )}

                {!detailQuery.isLoading && detailQuery.isError && (
                    <p className="text-danger-text">
                        {t(
                            getErrorI18nKey(
                                detailQuery.error,
                                adminRidesErrorMap
                            )
                        )}
                    </p>
                )}

                {!detailQuery.isLoading && data && (
                    <>
                        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                            <div>
                                <p className="text-lg font-bold text-text-primary">
                                    {route}
                                </p>
                                <p className="text-sm text-text-secondary mb-2">
                                    {formatDate(data.ride.departureAt, "—")}
                                </p>
                                <RideStatusBadge
                                    status={data.ride.rideStatus}
                                />
                            </div>
                        </div>

                        <div className="border border-border rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar
                                    name={driverName}
                                    size="md"
                                />
                                <div>
                                    <p className="text-sm font-bold text-text-primary">
                                        {driverName}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {data.ride.driver.email}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                <div>
                                    <p className={labelClass}>
                                        {t("admin.car")}
                                    </p>
                                    <p className="font-semibold text-text-primary">
                                        {carLabel}
                                    </p>
                                </div>
                                <div>
                                    <p className={labelClass}>
                                        {t("admin.spzPlate")}
                                    </p>
                                    <p className="font-semibold text-text-primary">
                                        {data.ride.car.spz}
                                    </p>
                                </div>
                                <div>
                                    <p className={labelClass}>
                                        {t("admin.seats")}
                                    </p>
                                    <p className="font-semibold text-text-primary">
                                        {data.ride.offeredSeats}
                                    </p>
                                </div>
                                <div>
                                    <p className={labelClass}>
                                        {t("admin.currency")}
                                    </p>
                                    <p className="font-semibold text-text-primary">
                                        {data.ride.currency}
                                    </p>
                                </div>
                                {data.ride.description && (
                                    <div className="col-span-2">
                                        <p className={labelClass}>
                                            {t("admin.description")}
                                        </p>
                                        <p className="text-text-primary whitespace-pre-wrap">
                                            {data.ride.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h3 className="text-base font-bold text-text-primary mb-3">
                            {t("admin.stops")}
                        </h3>
                        <ol className="flex flex-col gap-2 mb-6">
                            {data.ride.stops.map((stop) => (
                                <li
                                    key={stop.id}
                                    className="border border-border rounded-xl p-3"
                                >
                                    <p className="text-sm font-semibold text-text-primary">
                                        {stop.stopOrder + 1}. {stop.city}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {stop.address}
                                    </p>
                                    {(stop.plannedArrivalAt ||
                                        stop.plannedDepartureAt) && (
                                        <p className="text-xs text-text-secondary mt-1">
                                            {stop.plannedArrivalAt &&
                                                t("admin.arrival") +
                                                    ": " +
                                                    formatDate(
                                                        stop.plannedArrivalAt,
                                                        "—"
                                                    )}
                                            {stop.plannedArrivalAt &&
                                                stop.plannedDepartureAt &&
                                                " · "}
                                            {stop.plannedDepartureAt &&
                                                t("admin.departure") +
                                                    ": " +
                                                    formatDate(
                                                        stop.plannedDepartureAt,
                                                        "—"
                                                    )}
                                        </p>
                                    )}
                                </li>
                            ))}
                        </ol>

                        <h3 className="text-base font-bold text-text-primary mb-3">
                            {t("admin.confirmedPassengers", {
                                count: data.ride.bookings.length,
                            })}
                        </h3>
                        {data.ride.bookings.length === 0 ? (
                            <p className="text-sm text-text-secondary mb-6">
                                {t("admin.noBookings")}
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2 mb-6">
                                {data.ride.bookings.map((b) => {
                                    const passengerName =
                                        fullName(
                                            b.passenger.firstName,
                                            b.passenger.lastName
                                        ) || "—";
                                    return (
                                        <li
                                            key={b.id}
                                            className="border border-border rounded-xl p-3 flex items-center gap-3"
                                        >
                                            <Avatar
                                                name={passengerName}
                                                size="sm"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-text-primary">
                                                    {passengerName}
                                                </p>
                                                <p className="text-xs text-text-secondary">
                                                    {b.bookingStatus} ·{" "}
                                                    {b.seatCount}{" "}
                                                    {t("admin.seats")}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {data.ride.prices.length > 0 && (
                            <>
                                <h3 className="text-base font-bold text-text-primary mb-3">
                                    {t("admin.prices")}
                                </h3>
                                <ul className="flex flex-col gap-1 mb-6 text-sm">
                                    {data.ride.prices.map((p) => {
                                        const startStop = data.ride.stops.find(
                                            (s) => s.id === p.startStopId
                                        );
                                        const endStop = data.ride.stops.find(
                                            (s) => s.id === p.endStopId
                                        );
                                        return (
                                            <li
                                                key={`${p.startStopId}-${p.endStopId}`}
                                                className="flex justify-between border border-border rounded-xl px-3 py-2"
                                            >
                                                <span className="text-text-primary">
                                                    {startStop?.city ?? "—"} →{" "}
                                                    {endStop?.city ?? "—"}
                                                </span>
                                                <span className="font-semibold text-text-primary">
                                                    {formatPrice(
                                                        p.amount,
                                                        p.currency
                                                    )}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>
                        )}

                        {mutationErrorForThisRide !== null &&
                            mutationErrorForThisRide !== undefined && (
                                <p className="text-sm text-danger-text mb-4">
                                    {t(
                                        getErrorI18nKey(
                                            mutationErrorForThisRide,
                                            adminRidesErrorMap
                                        )
                                    )}
                                </p>
                            )}

                        {data.ride.rideStatus !== "CANCELLED" && (
                            <div className="flex gap-2 flex-wrap mb-6">
                                <Button
                                    variant="red"
                                    onClick={onRequestCancel}
                                    disabled={isThisRideMutating}
                                >
                                    {t("admin.forceCancel")}
                                </Button>
                            </div>
                        )}

                        <h3 className="text-base font-bold text-text-primary mb-3">
                            {t("admin.statusHistory")}
                        </h3>
                        {data.statusHistory.length === 0 ? (
                            <p className="text-sm text-text-secondary">
                                {t("admin.noStatusHistory")}
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {data.statusHistory.map((entry) => (
                                    <RideStatusHistoryEntry
                                        key={entry.id}
                                        entry={entry}
                                    />
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}
