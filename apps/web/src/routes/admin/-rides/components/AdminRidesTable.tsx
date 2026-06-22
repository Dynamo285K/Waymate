import { useTranslation } from "react-i18next";
import { Avatar, Button } from "@waymate/ui";
import type { AdminRideListItem } from "../../../../api-client/model/adminRideListItem";
import {
    fullName,
    formatDate,
} from "../../../../features/admin/lib/admin-format";
import { RideStatusBadge } from "./RideStatusBadge";

type AdminRidesTableProps = {
    items: AdminRideListItem[];
    rowMutatingId: string | null;
    onView: (ride: AdminRideListItem) => void;
    onCancel: (ride: AdminRideListItem) => void;
};

export function AdminRidesTable({
    items,
    rowMutatingId,
    onView,
    onCancel,
}: AdminRidesTableProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-card rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        {[
                            t("admin.driver"),
                            t("admin.route"),
                            t("admin.dateTime"),
                            t("admin.seats"),
                            t("admin.status"),
                            t("admin.actions"),
                        ].map((h) => (
                            <th
                                key={h}
                                className="text-left text-xs font-bold text-text-secondary tracking-wider px-5 py-4"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((ride) => {
                        const driverName =
                            fullName(
                                ride.driver.firstName,
                                ride.driver.lastName
                            ) || ride.driver.email;
                        const isThisRowMutating = rowMutatingId === ride.id;
                        const cancelDisabled =
                            isThisRowMutating ||
                            ride.rideStatus === "CANCELLED";
                        return (
                            <tr
                                key={ride.id}
                                className="border-b border-border last:border-0 hover:bg-background transition-colors"
                            >
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            name={driverName}
                                            size="sm"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-text-primary whitespace-nowrap">
                                                {driverName}
                                            </span>
                                            <span className="text-xs text-text-secondary">
                                                {ride.driver.email}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-text-primary whitespace-nowrap">
                                    {ride.originCity} → {ride.destinationCity}
                                </td>
                                <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                                    {formatDate(ride.departureAt, "—")}
                                </td>
                                <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                                    {t("admin.seatsTaken", {
                                        taken: ride.activeSeatCount,
                                        total: ride.offeredSeats,
                                    })}
                                </td>
                                <td className="px-5 py-4">
                                    <RideStatusBadge status={ride.rideStatus} />
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex gap-2 items-center">
                                        <Button
                                            variant="secondary"
                                            onClick={() => onView(ride)}
                                        >
                                            {t("admin.view")}
                                        </Button>
                                        <Button
                                            variant="red"
                                            onClick={() => onCancel(ride)}
                                            disabled={cancelDisabled}
                                        >
                                            {t("admin.forceCancel")}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
