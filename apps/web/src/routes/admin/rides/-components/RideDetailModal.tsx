import { useTranslation } from "react-i18next";
import { Button, CloseIcon, IconButton, Modal } from "@waymate/ui";
import { useGetRidesAdminById } from "../../../../api-client/rides/rides";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminRidesErrorMap } from "../-lib/admin-ride-errors";
import { formatDate } from "../../../../features/admin/lib/admin-format";
import { RideStatusBadge } from "./RideStatusBadge";
import { RideStatusHistoryEntry } from "./RideStatusHistoryEntry";
import { RideDriverCard } from "./RideDriverCard";
import { RideStopsList } from "./RideStopsList";
import { RidePassengersList } from "./RidePassengersList";
import { RidePricesList } from "./RidePricesList";

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
    const detailQuery = useGetRidesAdminById(rideId);

    const data = detailQuery.data;
    const originStop = data?.ride.stops[0];
    const destinationStop = data?.ride.stops[data.ride.stops.length - 1];
    const route = data
        ? `${originStop?.city ?? "—"} → ${destinationStop?.city ?? "—"}`
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

                        <RideDriverCard ride={data.ride} />

                        <h3 className="text-base font-bold text-text-primary mb-3">
                            {t("admin.stops")}
                        </h3>
                        <RideStopsList stops={data.ride.stops} />

                        <h3 className="text-base font-bold text-text-primary mb-3">
                            {t("admin.confirmedPassengers", {
                                count: data.ride.bookings.length,
                            })}
                        </h3>
                        <RidePassengersList bookings={data.ride.bookings} />

                        <RidePricesList ride={data.ride} />

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

                        {/* Force cancel only applies to a ride that hasn't run
                            yet. Keep the button visible for context but disable
                            it once the ride is in progress, completed, or
                            already cancelled — the backend enforces the same
                            PLANNED-only rule. */}
                        <div className="flex gap-2 flex-wrap mb-6">
                            <Button
                                variant="red"
                                onClick={onRequestCancel}
                                disabled={
                                    data.ride.rideStatus !== "PLANNED" ||
                                    isThisRideMutating
                                }
                            >
                                {t("admin.forceCancel")}
                            </Button>
                        </div>

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
