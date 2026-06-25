import { Button } from "@waymate/ui";
import type { RideCardLabels } from "../RideCard";

const actionClassName =
    "min-w-0 justify-center whitespace-nowrap text-center text-sm px-3 max-600:w-full";

export function PassengerPastActions({
    labels,
    alreadyReviewed,
    onRateDriver,
    onReport,
}: {
    labels?: RideCardLabels;
    alreadyReviewed?: boolean;
    onRateDriver: () => void;
    onReport?: () => void;
}) {
    return (
        <div className="grid grid-cols-1 gap-2 shrink-0 sm:grid-cols-2">
            <Button
                variant={alreadyReviewed ? "secondary" : "black"}
                className={actionClassName}
                onClick={onRateDriver}
                disabled={alreadyReviewed}
            >
                {alreadyReviewed
                    ? (labels?.rated ?? "Rated")
                    : (labels?.rateDriver ?? "Rate driver")}
            </Button>
            {onReport && (
                <Button
                    variant="secondary"
                    className={actionClassName}
                    onClick={onReport}
                >
                    {labels?.reportDriver ?? "Report driver"}
                </Button>
            )}
        </div>
    );
}
