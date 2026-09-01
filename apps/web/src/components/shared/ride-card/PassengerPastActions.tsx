import { Button } from "@/components/ui/Button";
import type { RideCardLabels } from "../RideCard";

const actionClassName =
    "min-w-0 justify-center whitespace-nowrap text-center text-xs px-3 py-1.5 max-600:w-full";

export function PassengerPastActions({
    labels,
    alreadyReviewed,
    bookingStatus,
    onRateDriver,
    onReport,
}: {
    labels?: RideCardLabels;
    alreadyReviewed?: boolean;
    bookingStatus?:
        | "CONFIRMED"
        | "COMPLETED"
        | "REJECTED"
        | "CANCELLED"
        | "NO_SHOW"
        | "PENDING";
    onRateDriver: () => void;
    onReport?: () => void;
}) {
    if (
        bookingStatus &&
        ["REJECTED", "CANCELLED", "NO_SHOW"].includes(bookingStatus)
    ) {
        let statusText = labels?.cancelled ?? "Cancelled";
        if (bookingStatus === "REJECTED")
            statusText = labels?.rejected ?? "Rejected";
        if (bookingStatus === "NO_SHOW")
            statusText = labels?.noShow ?? "No show";

        return (
            <div className="flex h-full items-end justify-end">
                <span className="text-subtitle font-medium text-text-tertiary">
                    {statusText}
                </span>
            </div>
        );
    }

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
