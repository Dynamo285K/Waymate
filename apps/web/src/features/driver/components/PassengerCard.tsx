import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StarIcon } from "@/components/ui/icons/StarIcon";
import { MessageCircleIcon } from "@/components/ui/icons/MessageCircleIcon";
import { CloseIcon } from "@/components/ui/icons/CloseIcon";
import { AlertIcon } from "@/components/ui/icons/AlertIcon";

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
    price?: number;
    currency?: string;
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
    price,
    currency,
    onSendMessage,
    onCancelBooking,
    onReport,
    labels,
}: PassengerCardProps) {
    return (
        <div className="flex justify-between items-center py-5 px-6 bg-card border border-border rounded-2xl max-600:flex-col max-600:items-stretch max-600:gap-4 max-600:p-4">
            <div className="flex items-start justify-between max-600:w-full shrink-0 min-w-0">
                <div className="flex items-center gap-4 min-w-0">
                    <Avatar
                        name={name}
                        size="lg"
                    />
                    <div className="flex flex-col gap-0.75 min-w-0">
                        <span className="text-base font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                            {name}
                        </span>
                        <div className="flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0">
                            <StarIcon />
                            <span className="text-sm text-text-secondary">
                                {rating.toFixed(1)}
                            </span>
                        </div>
                        {from && to && (
                            <span className="text-sm text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
                                {from} → {to}
                            </span>
                        )}
                        <span className="text-sm text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
                            {labels?.seatsReserved
                                ? labels.seatsReserved(seatsReserved)
                                : `${seatsReserved} seat(s) reserved`}
                        </span>
                    </div>
                </div>
                {/* Mobile Top Right: Price + Report */}
                <div className="hidden max-600:flex items-center gap-3 mt-1.5 self-start">
                    {price !== undefined && (
                        <span className="text-xl font-bold text-text-primary">
                            {price}
                            {currency === "EUR" ? "€" : (currency ?? "€")}
                        </span>
                    )}
                    {onReport && (
                        <button
                            type="button"
                            onClick={onReport}
                            title={labels?.reportUser ?? "Report"}
                            className="p-1.5 text-text-secondary hover:text-red transition-colors cursor-pointer active:scale-95"
                        >
                            <AlertIcon />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6 shrink-0 max-600:w-full max-600:justify-end">
                {/* Desktop Top Right: Price + Report */}
                <div className="flex items-center gap-3 max-600:hidden">
                    {price !== undefined && (
                        <span className="text-xl font-bold text-text-primary">
                            {price}
                            {currency === "EUR" ? "€" : (currency ?? "€")}
                        </span>
                    )}
                    {onReport && (
                        <button
                            type="button"
                            onClick={onReport}
                            title={labels?.reportUser ?? "Report"}
                            className="p-1.5 -mr-1.5 text-text-secondary hover:text-red transition-colors cursor-pointer active:scale-95"
                        >
                            <AlertIcon />
                        </button>
                    )}
                </div>

                <div className="flex gap-2 shrink-0 max-600:w-full max-600:grid max-600:grid-cols-2">
                    <Button
                        variant="black"
                        onClick={onSendMessage}
                        leftIcon={<MessageCircleIcon />}
                        className="max-600:w-full max-600:px-3"
                    >
                        {labels?.sendMessage ?? "Send message"}
                    </Button>
                    <Button
                        variant="red"
                        onClick={onCancelBooking}
                        leftIcon={<CloseIcon />}
                        className="max-600:w-full max-600:px-3"
                    >
                        {labels?.cancelBooking ?? "Cancel booking"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
