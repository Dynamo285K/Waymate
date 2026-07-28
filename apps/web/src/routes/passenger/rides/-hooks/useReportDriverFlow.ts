import { useState } from "react";
import type { DisplayedRide } from "../-lib/passenger-ride-view";

export interface ReportTarget {
    driverId: string;
    driverName: string;
    rideId: string;
}

/**
 * Owns the "report the driver" modal target. The report form itself lives in
 * `ReportUserModal`; this hook only tracks which driver/ride the modal is open
 * for so the route component stays a thin orchestrator. `open` takes the
 * target directly so it can be triggered both from a card's `DisplayedRide`
 * (via `openFor`) and from the ride-details modal, which fetches its own data.
 */
export function useReportDriverFlow() {
    const [target, setTarget] = useState<ReportTarget | null>(null);

    function open(target: ReportTarget) {
        setTarget(target);
    }

    function openFor(ride: DisplayedRide) {
        if (!ride.driverId || !ride.rideId) return;
        open({
            driverId: ride.driverId,
            driverName: ride.driverName,
            rideId: ride.rideId,
        });
    }

    return {
        target,
        open,
        openFor,
        close: () => setTarget(null),
    };
}
