import { Avatar, Button, StarIcon } from "@waymate/ui";
import "./PassengerCard.css";

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
    onSendMessage: () => void;
    onCancelBooking: () => void;
    onReport?: () => void;
    labels?: PassengerCardLabels;
};

export function PassengerCard({
    name,
    rating,
    seatsReserved,
    onSendMessage,
    onCancelBooking,
    onReport,
    labels,
}: PassengerCardProps) {
    return (
        <div className="passenger-card">
            <div className="passenger-card__left">
                <Avatar
                    name={name}
                    size="lg"
                />
                <div className="passenger-card__info">
                    <span className="passenger-card__name">{name}</span>
                    <div className="passenger-card__rating">
                        <StarIcon />
                        <span className="passenger-card__rating-value">
                            {rating}
                        </span>
                    </div>
                    <span className="passenger-card__seats">
                        {labels?.seatsReserved
                            ? labels.seatsReserved(seatsReserved)
                            : `${seatsReserved} seat(s) reserved`}
                    </span>
                </div>
            </div>
            <div className="passenger-card__actions">
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
