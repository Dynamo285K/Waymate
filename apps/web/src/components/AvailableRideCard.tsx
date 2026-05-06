import { Avatar, Button, StarIcon, ClockIcon, UserIcon } from "@waymate/ui";
import "./AvailableRideCard.css";

export type AvailableRideCardLabels = {
    seatsLeft?: (count: number) => string;
    book?: string;
};

export type AvailableRideCardProps = {
    from: string;
    to: string;
    datetime: string;
    seatsLeft: number;
    driverName: string;
    driverRating: number;
    price: number;
    onBook: () => void;
    labels?: AvailableRideCardLabels;
};

export function AvailableRideCard({
    from,
    to,
    datetime,
    seatsLeft,
    driverName,
    driverRating,
    price,
    onBook,
    labels,
}: AvailableRideCardProps) {
    return (
        <div className="available-ride-card">
            <div className="available-ride-card__left">
                <span className="available-ride-card__route">
                    {from} → {to}
                </span>
                <div className="available-ride-card__meta">
                    <ClockIcon />
                    <span className="available-ride-card__meta-text">
                        {datetime}
                    </span>
                    <UserIcon />
                    <span className="available-ride-card__meta-text">
                        {labels?.seatsLeft
                            ? labels.seatsLeft(seatsLeft)
                            : `${seatsLeft} seats left`}
                    </span>
                </div>
            </div>
            <div className="available-ride-card__driver">
                <Avatar
                    name={driverName}
                    size="sm"
                />
                <div className="available-ride-card__driver-info">
                    <span className="available-ride-card__driver-name">
                        {driverName}
                    </span>
                    <div className="available-ride-card__driver-rating">
                        <StarIcon />
                        <span className="available-ride-card__driver-rating-value">
                            {driverRating}
                        </span>
                    </div>
                </div>
            </div>
            <div className="available-ride-card__right">
                <span className="available-ride-card__price">{price}€</span>
                <Button
                    variant="black"
                    onClick={onBook}
                >
                    {labels?.book ?? "Book"}
                </Button>
            </div>
        </div>
    );
}
