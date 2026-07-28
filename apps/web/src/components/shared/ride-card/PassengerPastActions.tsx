import { Button } from "@waymate/ui";
import type { RideCardLabels } from "../RideCard";

const actionClassName =
    "min-w-0 justify-center whitespace-nowrap text-center text-xs px-3 py-1.5 max-600:w-full";

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
        <div className="flex flex-wrap justify-end gap-2 shrink-0 max-600:flex-col">
            {onReport && (
                <Button
                    variant="red"
                    className={actionClassName}
                    onClick={onReport}
                >
                    {labels?.reportDriver ?? "Report driver"}
                </Button>
            )}
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
        </div>
    );
}
