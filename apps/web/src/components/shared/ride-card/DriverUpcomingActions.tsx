import { Button } from "@/components/ui/Button";
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
        <div className="flex shrink-0 flex-col gap-2 max-600:flex-row max-600:w-full">
            {labels?.viewPassengers !== "" && (
                <Button
                    variant="secondary"
                    className="justify-center max-600:flex-1 max-600:min-w-0 max-600:px-3"
                    onClick={onViewPassengers}
                >
                    {labels?.viewPassengers ?? "View passengers"}
                </Button>
            )}
            {onCompleteRide && (
                <Button
                    variant="outlineSuccess"
                    className="justify-center rounded-lg! max-600:flex-1 max-600:min-w-0 max-600:px-3"
                    onClick={onCompleteRide}
                >
                    {labels?.completeRide ?? "Complete ride"}
                </Button>
            )}
            {onCancelRide && (
                <Button
                    variant="red"
                    className="justify-center max-600:flex-1 max-600:min-w-0 max-600:px-3"
                    onClick={onCancelRide}
                >
                    {labels?.cancelRide ?? "Cancel ride"}
                </Button>
            )}
        </div>
    );
}
