import { Avatar, Button, StarIcon } from "@waymate/ui";

export type PassengerCardLabels = {
    seatsReserved?: (count: number) => string;
    sendMessage?: string;
    cancelBooking?: string;
    reportUser?: string;
};

export type PassengerCardProps = {
    name: string;
    rating: number;
    seatsReserved: number;
    from?: string;
    to?: string;
    onSendMessage: () => void;
    onCancelBooking: () => void;
    onReport?: () => void;
    labels?: PassengerCardLabels;
};

export function PassengerCard({
    name,
    rating,
    seatsReserved,
    from,
    to,
    onSendMessage,
    onCancelBooking,
    onReport,
    labels,
}: PassengerCardProps) {
    return (
        <div className="flex justify-between items-center py-5 px-6 bg-card border border-border rounded-2xl max-600:flex-wrap max-600:gap-3 max-600:p-4">
            <div className="flex items-center gap-4 max-600:flex-1 max-600:min-w-0">
                <Avatar
                    name={name}
                    size="lg"
                />
                <div className="flex flex-col gap-0.75">
                    <span className="text-base font-semibold text-text-primary">
                        {name}
                    </span>
                    <div className="flex items-center gap-1 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-dark-yellow [&_svg]:fill-dark-yellow [&_svg]:shrink-0">
                        <StarIcon />
                        <span className="text-sm text-text-secondary">
                            {rating.toFixed(1)}
                        </span>
                    </div>
                    {from && to && (
                        <span className="text-sm text-text-secondary">
                            {from} → {to}
                        </span>
                    )}
                    <span className="text-sm text-text-secondary">
                        {labels?.seatsReserved
                            ? labels.seatsReserved(seatsReserved)
                            : `${seatsReserved} seat(s) reserved`}
                    </span>
                </div>
            </div>
            <div className="flex gap-2 shrink-0 max-600:w-full max-600:justify-end">
                <Button
                    variant="black"
                    onClick={onSendMessage}
                >
                    {labels?.sendMessage ?? "Send message"}
                </Button>
                <Button
                    variant="red"
                    onClick={onCancelBooking}
                >
                    {labels?.cancelBooking ?? "Cancel booking"}
                </Button>
                {onReport && (
                    <Button
                        variant="secondary"
                        onClick={onReport}
                    >
                        {labels?.reportUser ?? "Report"}
                    </Button>
                )}
            </div>
        </div>
    );
}
