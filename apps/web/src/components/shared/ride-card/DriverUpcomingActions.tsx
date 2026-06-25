import { Button } from "@waymate/ui";
import type { RideCardLabels } from "../RideCard";

export function DriverUpcomingActions({
    labels,
    onViewPassengers,
    onCompleteRide,
    onCancelRide,
}: {
    labels?: RideCardLabels;
    onViewPassengers: () => void;
    onCompleteRide?: () => void;
    onCancelRide?: () => void;
}) {
    return (
        <div className="flex shrink-0 flex-col gap-2 max-600:w-36">
            {labels?.viewPassengers !== "" && (
                <Button
                    variant="secondary"
                    className="justify-center max-600:min-w-0 max-600:px-3 max-600:text-caption"
                    onClick={onViewPassengers}
                >
                    {labels?.viewPassengers ?? "View passengers"}
                </Button>
            )}
            {onCompleteRide && (
                <Button
                    variant="outlineSuccess"
                    className="justify-center rounded-lg! max-600:min-w-0 max-600:px-3 max-600:text-caption"
                    onClick={onCompleteRide}
                >
                    {labels?.completeRide ?? "Complete ride"}
                </Button>
            )}
            {onCancelRide && (
                <Button
                    variant="red"
                    className="justify-center max-600:min-w-0 max-600:px-3 max-600:text-caption"
                    onClick={onCancelRide}
                >
                    {labels?.cancelRide ?? "Cancel ride"}
                </Button>
            )}
        </div>
    );
}
