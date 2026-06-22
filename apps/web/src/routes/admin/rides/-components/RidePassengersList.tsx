import { useTranslation } from "react-i18next";
import { Avatar } from "@waymate/ui";
import type { AdminRideDetailBookingsItem } from "../../../../api-client/model/adminRideDetailBookingsItem";
import { fullName } from "../../../../features/admin/lib/admin-format";

export function RidePassengersList({
    bookings,
}: {
    bookings: AdminRideDetailBookingsItem[];
}) {
    const { t } = useTranslation();

    if (bookings.length === 0) {
        return (
            <p className="text-sm text-text-secondary mb-6">
                {t("admin.noBookings")}
            </p>
        );
    }

    return (
        <ul className="flex flex-col gap-2 mb-6">
            {bookings.map((b) => {
                const passengerName =
                    fullName(b.passenger.firstName, b.passenger.lastName) ||
                    "—";
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
                                {b.bookingStatus} · {b.seatCount}{" "}
                                {t("admin.seats")}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
