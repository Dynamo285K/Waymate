import { Button } from "@waymate/ui";
import type { RideCardLabels } from "../RideCard";

const actionClassName =
    "min-w-0 justify-center whitespace-nowrap text-center text-xs px-3 py-1.5 max-600:w-full";

export function PassengerUpcomingActions({
    labels,
    status,
    onSendMessage,
    onCancelBooking,
}: {
    labels?: RideCardLabels;
    status: "pending" | "confirmed";
    onSendMessage?: () => void;
    onCancelBooking: () => void;
}) {
    return (
        <div className="flex flex-wrap justify-end gap-2 shrink-0 max-600:flex-col">
            {status === "pending" && (
                <Button
                    variant="secondary"
                    className={actionClassName}
                >
                    {labels?.pendingConfirmation ?? "Pending confirmation"}
                </Button>
            )}
            {onSendMessage && (
                <Button
                    variant="secondary"
                    className={actionClassName}
                    onClick={onSendMessage}
                >
                    {labels?.messageDriver ?? "Message driver"}
                </Button>
            )}
            <Button
                variant="outline"
                className={actionClassName}
                onClick={onCancelBooking}
            >
                {labels?.cancelBooking ?? "Cancel booking"}
            </Button>
        </div>
    );
}
