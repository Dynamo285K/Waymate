import type { RideStatus } from "../../api-client/model/rideStatus";
import {
    RIDE_STATUS_BADGE_CLASSES,
    useRideStatusLabels,
} from "../../lib/admin-ride-labels";

export function RideStatusBadge({ status }: { status: RideStatus }) {
    const labels = useRideStatusLabels();
    return (
        <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${RIDE_STATUS_BADGE_CLASSES[status]}`}
        >
            {labels[status]}
        </span>
    );
}
