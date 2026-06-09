import { Avatar, Button, StarIcon, MapPinIcon, ClockIcon } from "@waymate/ui";
import "./RideRequestCard.css";

export type RideRequestCardLabels = {
    seatsRequired?: (count: number) => string;
    accept?: string;
    decline?: string;
};

export type RideRequestCardProps = {
    name: string;
    rating: number;
    seatsRequired: number;
    from: string;
    to: string;
    originalStartCity: string;
    originalEndCity: string;
    datetime: string;
    onAccept: () => void;
    onDecline: () => void;
    labels?: RideRequestCardLabels;
};

export function RideRequestCard({
    name,
    rating,
    seatsRequired,
    from,
    to,
    originalStartCity,
    originalEndCity,
    datetime,
    onAccept,
    onDecline,
    labels,
}: RideRequestCardProps) {
    return (
        <div className="ride-request-card">
            <div className="ride-request-card__passenger">
                <Avatar
                    name={name}
                    size="lg"
                />
                <div className="ride-request-card__passenger-info">
                    <span className="ride-request-card__name">{name}</span>
                    <div className="ride-request-card__rating">
                        <StarIcon />
                        <span className="ride-request-card__rating-value">
                            {rating}
                        </span>
                    </div>
                    <span className="ride-request-card__seats">
                        {labels?.seatsRequired
                            ? labels.seatsRequired(seatsRequired)
                            : `${seatsRequired} seat(s) required`}
                    </span>
                </div>
            </div>
            <div className="ride-request-card__route">
                <div className="ride-request-card__route-origin">
                    <span className="ride-request-card__route-dot" />
                    <span className="ride-request-card__route-label">
                        {from}
                    </span>
                </div>
                <div className="ride-request-card__route-line" />
                <div className="ride-request-card__route-destination">
                    <MapPinIcon />
                    <span className="ride-request-card__route-label">{to}</span>
                </div>
                {(originalStartCity !== from || originalEndCity !== to) && (
                    <span className="text-sm text-gray-500 mt-1 block">
                        {originalStartCity} → {originalEndCity}
                    </span>
                )}
                <div className="ride-request-card__meta">
                    <ClockIcon />
                    <span className="ride-request-card__meta-text">
                        {datetime}
                    </span>
                </div>
            </div>
            <div className="ride-request-card__actions">
                <Button
                    variant="black"
                    onClick={onAccept}
                >
                    ✓ {labels?.accept ?? "Accept"}
                </Button>
                <Button
                    variant="red"
                    onClick={onDecline}
                >
                    ✕ {labels?.decline ?? "Decline"}
                </Button>
            </div>
        </div>
    );
}
