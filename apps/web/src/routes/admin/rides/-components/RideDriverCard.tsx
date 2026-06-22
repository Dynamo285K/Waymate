import { useTranslation } from "react-i18next";
import { Avatar } from "@waymate/ui";
import type { AdminRideDetail } from "../../../../api-client/model/adminRideDetail";
import { fullName } from "../../../../features/admin/lib/admin-format";

const labelClass =
    "text-xs font-bold text-text-secondary tracking-wider mb-1 block";

export function RideDriverCard({ ride }: { ride: AdminRideDetail }) {
    const { t } = useTranslation();

    const driverName =
        fullName(ride.driver.firstName, ride.driver.lastName) ||
        ride.driver.email;
    const carLabel =
        [ride.car.brand, ride.car.modelName].filter(Boolean).join(" ") ||
        ride.car.spz;

    return (
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
                        {ride.driver.email}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                    <p className={labelClass}>{t("admin.car")}</p>
                    <p className="font-semibold text-text-primary">
                        {carLabel}
                    </p>
                </div>
                <div>
                    <p className={labelClass}>{t("admin.spzPlate")}</p>
                    <p className="font-semibold text-text-primary">
                        {ride.car.spz}
                    </p>
                </div>
                <div>
                    <p className={labelClass}>{t("admin.seats")}</p>
                    <p className="font-semibold text-text-primary">
                        {ride.offeredSeats}
                    </p>
                </div>
                <div>
                    <p className={labelClass}>{t("admin.currency")}</p>
                    <p className="font-semibold text-text-primary">
                        {ride.currency}
                    </p>
                </div>
                {ride.description && (
                    <div className="col-span-2">
                        <p className={labelClass}>{t("admin.description")}</p>
                        <p className="text-text-primary whitespace-pre-wrap">
                            {ride.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
