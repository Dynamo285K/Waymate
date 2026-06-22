import { useTranslation } from "react-i18next";
import type { AdminRideDetailStopsItem } from "../../../../api-client/model/adminRideDetailStopsItem";
import { formatDate } from "../../../../features/admin/lib/admin-format";

export function RideStopsList({
    stops,
}: {
    stops: AdminRideDetailStopsItem[];
}) {
    const { t } = useTranslation();

    return (
        <ol className="flex flex-col gap-2 mb-6">
            {stops.map((stop) => (
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
                    {(stop.plannedArrivalAt || stop.plannedDepartureAt) && (
                        <p className="text-xs text-text-secondary mt-1">
                            {stop.plannedArrivalAt &&
                                t("admin.arrival") +
                                    ": " +
                                    formatDate(stop.plannedArrivalAt, "—")}
                            {stop.plannedArrivalAt &&
                                stop.plannedDepartureAt &&
                                " · "}
                            {stop.plannedDepartureAt &&
                                t("admin.departure") +
                                    ": " +
                                    formatDate(stop.plannedDepartureAt, "—")}
                        </p>
                    )}
                </li>
            ))}
        </ol>
    );
}
