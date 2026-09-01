import { Button } from "@/components/ui/Button";
import type { RideCardLabels } from "../RideCard";
import type { PassengerBookingListItem } from "@/api-client/model/passengerBookingListItem";

const actionClassName =
    "min-w-0 justify-center whitespace-nowrap text-center text-xs px-3 py-1.5 max-600:w-full";

export function PassengerPastActions({
    labels,
    alreadyReviewed,
    bookingStatus,
    cancelledByUserId,
    currentUserId,
    onRateDriver,
    onReport,
}: {
    labels?: RideCardLabels;
    alreadyReviewed?: boolean;
    bookingStatus?: PassengerBookingListItem["bookingStatus"];
    cancelledByUserId?: string | null;
    currentUserId?: string | null;
    onRateDriver: () => void;
    onReport?: () => void;
}) {
    if (
        bookingStatus &&
        ["REJECTED", "CANCELLED", "NO_SHOW"].includes(bookingStatus)
    ) {
        let statusText = labels?.cancelled ?? "Cancelled";
        let textColor = "text-text-secondary";

        if (bookingStatus === "CANCELLED") {
            if (
                cancelledByUserId &&
                currentUserId &&
                cancelledByUserId === currentUserId
            ) {
                statusText = labels?.cancelledByYou ?? "Cancelled by you";
            } else if (
                cancelledByUserId &&
                currentUserId &&
                cancelledByUserId !== currentUserId
            ) {
                statusText = labels?.cancelledByDriver ?? "Cancelled by driver";
                textColor = "text-red";
            }
        } else if (bookingStatus === "REJECTED") {
            statusText = labels?.rejected ?? "Rejected";
            textColor = "text-red";
        } else if (bookingStatus === "NO_SHOW") {
            statusText = labels?.noShow ?? "No show";
            textColor = "text-red";
        }

        return (
            <div className="flex h-full items-end justify-end">
                <span className={`text-control font-semibold ${textColor}`}>
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
