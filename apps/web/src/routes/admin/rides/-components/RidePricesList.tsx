import { useTranslation } from "react-i18next";
import type { AdminRideDetail } from "../../../../api-client/model/adminRideDetail";
import { formatPrice } from "../../../../features/admin/lib/admin-format";

export function RidePricesList({ ride }: { ride: AdminRideDetail }) {
    const { t } = useTranslation();

    if (ride.prices.length === 0) return null;

    return (
        <>
            <h3 className="text-base font-bold text-text-primary mb-3">
                {t("admin.prices")}
            </h3>
            <ul className="flex flex-col gap-1 mb-6 text-sm">
                {ride.prices.map((p) => {
                    const startStop = ride.stops.find(
                        (s) => s.id === p.startStopId
                    );
                    const endStop = ride.stops.find(
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
                                {formatPrice(p.amount, p.currency)}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
