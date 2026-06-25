import { Button } from "@waymate/ui";
import type { RideCardLabels } from "../RideCard";

const actionClassName =
    "min-w-0 justify-center whitespace-nowrap text-center text-sm px-3 max-600:w-full";

export function PassengerUpcomingActions({
    labels,
    status,
    onSendMessage,
    onCancelBooking,
    onReport,
}: {
    labels?: RideCardLabels;
    status: "pending" | "confirmed";
    onSendMessage?: () => void;
    onCancelBooking: () => void;
    onReport?: () => void;
}) {
    return (
        <div className="grid grid-cols-1 gap-2 shrink-0 sm:grid-cols-3">
            {onSendMessage && (
                <Button
                    variant="secondary"
                    className={actionClassName}
                    onClick={onSendMessage}
                >
                    {labels?.messageDriver ?? "Message driver"}
                </Button>
            )}
            {status === "pending" && (
                <Button
                    variant="secondary"
                    className={actionClassName}
                >
                    {labels?.pendingConfirmation ?? "Pending confirmation"}
                </Button>
            )}
            <Button
                variant="red"
                className={actionClassName}
                onClick={onCancelBooking}
            >
                {labels?.cancelBooking ?? "Cancel booking"}
            </Button>
            {status === "confirmed" && onReport && (
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
