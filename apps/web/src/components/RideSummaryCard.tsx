import {
    Button,
    CircleIcon,
    ClockIcon,
    MapPinIcon,
    UserIcon,
    VerticalLineIcon,
} from "@waymate/ui";
import "./RideSummaryCard.css";

export type RideSummaryCardProps = {
    pickup: string;
    dropoff: string;
    dateTime: string;
    seatsLeft: string;
    price: string;
    onManageClick?: () => void;
    onCancelClick?: () => void;
};

export function RideSummaryCard({
    pickup,
    dropoff,
    dateTime,
    seatsLeft,
    price,
    onManageClick,
    onCancelClick,
}: RideSummaryCardProps) {
    return (
        <div className="ride-summary-card">
            <div className="ride-summary-card__left">
                <div className="ride-summary-card__route">
                    <div className="ride-summary-card__route-row">
                        <span className="ride-summary-card__route-icon">
                            <CircleIcon />
                        </span>
                        <span className="ride-summary-card__route-text">
                            {pickup}
                        </span>
                    </div>
                    <div className="ride-summary-card__route-line">
                        <VerticalLineIcon />
                    </div>
                    <div className="ride-summary-card__route-row">
                        <span className="ride-summary-card__route-icon">
                            <MapPinIcon />
                        </span>
                        <span className="ride-summary-card__route-text">
                            {dropoff}
                        </span>
                    </div>
                </div>
                <div className="ride-summary-card__meta">
                    <div className="ride-summary-card__meta-item">
                        <ClockIcon />
                        <span>{dateTime}</span>
                    </div>
                    <div className="ride-summary-card__meta-item">
                        <UserIcon />
                        <span>{seatsLeft}</span>
                    </div>
                </div>
            </div>
            <div className="ride-summary-card__right">
                <div className="ride-summary-card__price">{price}</div>
                <div className="ride-summary-card__actions">
                    <Button onClick={onManageClick}>Manage</Button>
                    <button
                        type="button"
                        className="ride-summary-card__cancel"
                        onClick={onCancelClick}
                    >
                        Cancel ride
                    </button>
                </div>
            </div>
        </div>
    );
}
