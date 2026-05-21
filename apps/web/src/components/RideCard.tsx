import {
    Avatar,
    Button,
    StarIcon,
    MapPinIcon,
    ClockIcon,
    UserIcon,
} from "@waymate/ui";
import "./RideCard.css";

export type RideCardLabels = {
    seatsLeft?: (count: number) => string;
    full?: string;
    pendingConfirmation?: string;
    cancelBooking?: string;
    rateDriver?: string;
    reportDriver?: string;
    viewPassengers?: string;
    cancelRide?: string;
    ratePassengers?: string;
};

type RideCardBaseProps = {
    from: string;
    to: string;
    datetime: string;
    price: number;
    labels?: RideCardLabels;
};

type DriverPastProps = RideCardBaseProps & {
    variant: "driver-past";
    onRatePassengers: () => void;
};
type DriverUpcomingProps = RideCardBaseProps & {
    variant: "driver-upcoming";
    seatsLeft: number | "full";
    onViewPassengers: () => void;
    onCancelRide: () => void;
};
type PassengerUpcomingProps = RideCardBaseProps & {
    variant: "passenger-upcoming";
    driverName: string;
    driverRating: number;
    seatsLeft?: number;
    status: "pending" | "confirmed";
    onCancelBooking: () => void;
    onReport?: () => void;
};
type PassengerPastProps = RideCardBaseProps & {
    variant: "passenger-past";
    driverName: string;
    driverRating: number;
    onRateDriver: () => void;
    onReport?: () => void;
};

export type RideCardProps =
    | DriverUpcomingProps
    | DriverPastProps
    | PassengerUpcomingProps
    | PassengerPastProps;

export function RideCard(props: RideCardProps) {
    const { from, to, datetime, price, labels } = props;

    function seatsText(count: number) {
        return labels?.seatsLeft
            ? labels.seatsLeft(count)
            : `${count} seats left`;
    }

    return (
        <div className="ride-card">
            <div className="ride-card__left">
                <div className="ride-card__route">
                    <div className="ride-card__route-origin">
                        <span className="ride-card__route-dot" />
                        <span className="ride-card__route-label">{from}</span>
                    </div>
                    <div className="ride-card__route-line" />
                    <div className="ride-card__route-destination">
                        <MapPinIcon />
                        <span className="ride-card__route-label">{to}</span>
                    </div>
                </div>
                <div className="ride-card__meta">
                    <ClockIcon />
                    <span className="ride-card__meta-text">{datetime}</span>
                    {props.variant === "driver-upcoming" && (
                        <>
                            <UserIcon />
                            <span className="ride-card__meta-text">
                                {props.seatsLeft === "full"
                                    ? (labels?.full ?? "Full")
                                    : seatsText(props.seatsLeft)}
                            </span>
                        </>
                    )}
                    {props.variant === "passenger-upcoming" &&
                        props.seatsLeft !== undefined && (
                            <>
                                <UserIcon />
                                <span className="ride-card__meta-text">
                                    {seatsText(props.seatsLeft)}
                                </span>
                            </>
                        )}
                </div>
            </div>
            <div className="ride-card__right">
                {(props.variant === "passenger-upcoming" ||
                    props.variant === "passenger-past") && (
                    <div className="ride-card__driver">
                        <Avatar
                            name={props.driverName}
                            size="md"
                        />
                        <div className="ride-card__driver-info">
                            <span className="ride-card__driver-name">
                                {props.driverName}
                            </span>
                            <div className="ride-card__driver-rating">
                                <StarIcon />
                                <span className="ride-card__driver-rating-value">
                                    {props.driverRating.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                <div className="ride-card__price-actions">
                    <span className="ride-card__price">{price}€</span>
                    {props.variant === "driver-upcoming" && (
                        <>
                            <div className="ride-card__actions">
                                {labels?.viewPassengers !== "" && (
                                    <Button
                                        variant="secondary"
                                        onClick={props.onViewPassengers}
                                    >
                                        {labels?.viewPassengers ??
                                            "View passengers"}
                                    </Button>
                                )}
                                <Button
                                    variant="red"
                                    onClick={props.onCancelRide}
                                >
                                    {labels?.cancelRide ?? "Cancel ride"}
                                </Button>
                            </div>
                            <span className="ride-card__seats-bottom">
                                {props.seatsLeft === "full"
                                    ? (labels?.full ?? "Full")
                                    : seatsText(props.seatsLeft)}
                            </span>
                        </>
                    )}
                    {props.variant === "driver-past" && (
                        <Button
                            variant="black"
                            onClick={props.onRatePassengers}
                        >
                            {labels?.ratePassengers ?? "Rate passengers"}
                        </Button>
                    )}
                    {props.variant === "passenger-upcoming" && (
                        <div className="ride-card__actions">
                            {props.status === "pending" ? (
                                <Button variant="secondary">
                                    {labels?.pendingConfirmation ??
                                        "Pending confirmation"}
                                </Button>
                            ) : (
                                <Button
                                    variant="red"
                                    onClick={props.onCancelBooking}
                                >
                                    {labels?.cancelBooking ?? "Cancel booking"}
                                </Button>
                            )}
                            {props.status === "confirmed" && props.onReport && (
                                <Button
                                    variant="secondary"
                                    onClick={props.onReport}
                                >
                                    {labels?.reportDriver ?? "Report driver"}
                                </Button>
                            )}
                        </div>
                    )}
                    {props.variant === "passenger-past" && (
                        <div className="ride-card__actions">
                            <Button
                                variant="black"
                                onClick={props.onRateDriver}
                            >
                                {labels?.rateDriver ?? "Rate driver"}
                            </Button>
                            {props.onReport && (
                                <Button
                                    variant="secondary"
                                    onClick={props.onReport}
                                >
                                    {labels?.reportDriver ?? "Report driver"}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
