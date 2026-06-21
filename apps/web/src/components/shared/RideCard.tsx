import {
    Avatar,
    Button,
    StarIcon,
    MapPinIcon,
    ClockIcon,
    UserIcon,
} from "@waymate/ui";

export type RideCardLabels = {
    seatsLeft?: (count: number) => string;
    full?: string;
    pendingConfirmation?: string;
    cancelBooking?: string;
    rateDriver?: string;
    rated?: string;
    reportDriver?: string;
    messageDriver?: string;
    viewPassengers?: string;
    cancelRide?: string;
    completeRide?: string;
    ratePassengers?: string;
};

type RideCardBaseProps = {
    from: string;
    to: string;
    datetime: string;
    price: number;
    duration?: string;
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
    onCancelRide?: () => void;
    onCompleteRide?: () => void;
};
type PassengerUpcomingProps = RideCardBaseProps & {
    variant: "passenger-upcoming";
    driverName: string;
    driverRating: number;
    seatsLeft?: number;
    status: "pending" | "confirmed";
    onCancelBooking: () => void;
    onReport?: () => void;
    onSendMessage?: () => void;
};
type PassengerPastProps = RideCardBaseProps & {
    variant: "passenger-past";
    driverName: string;
    driverRating: number;
    onRateDriver: () => void;
    alreadyReviewed?: boolean;
    onReport?: () => void;
};

export type RideCardProps =
    | DriverUpcomingProps
    | DriverPastProps
    | PassengerUpcomingProps
    | PassengerPastProps;

export function RideCard(props: RideCardProps) {
    const { from, to, datetime, price, duration, labels } = props;

    const hasDriver =
        props.variant === "passenger-upcoming" ||
        props.variant === "passenger-past";

    function seatsText(count: number) {
        return labels?.seatsLeft
            ? labels.seatsLeft(count)
            : `${count} seats left`;
    }

    return (
        <div
            data-testid="ride-card"
            className="flex justify-between items-center gap-4 py-5 px-6 bg-(--color-card) border border-(--color-border) rounded-2xl max-600:flex-col max-600:items-stretch max-600:gap-3 max-600:p-4"
        >
            <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border-2 border-(--color-text-primary) shrink-0" />
                        <span className="text-[17px] font-semibold text-(--color-text-primary)">
                            {from}
                        </span>
                    </div>
                    <div className="w-0.5 h-5 bg-(--color-text-secondary) ml-1.25" />
                    <div className="flex items-center gap-2 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-(--color-text-primary) [&_svg]:shrink-0">
                        <MapPinIcon />
                        <span className="text-[17px] font-semibold text-(--color-text-primary)">
                            {to}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 max-600:flex-wrap [&_svg]:w-4 [&_svg]:h-4 [&_svg]:text-(--color-text-secondary) [&_svg]:shrink-0">
                    <ClockIcon />
                    <span className="text-sm text-(--color-text-secondary) max-600:whitespace-nowrap">
                        {datetime}
                    </span>
                    {duration && (
                        <span className="text-sm text-(--color-text-secondary) max-600:whitespace-nowrap">
                            · {duration}
                        </span>
                    )}
                    {props.variant === "driver-upcoming" && (
                        <span className="ml-3 inline-flex items-center gap-1.5">
                            <UserIcon />
                            <span className="text-sm text-(--color-text-secondary)">
                                {props.seatsLeft === "full"
                                    ? (labels?.full ?? "Full")
                                    : seatsText(props.seatsLeft)}
                            </span>
                        </span>
                    )}
                    {props.variant === "passenger-upcoming" &&
                        props.seatsLeft !== undefined && (
                            <span className="ml-3 inline-flex items-center gap-1.5">
                                <UserIcon />
                                <span className="text-sm text-(--color-text-secondary)">
                                    {seatsText(props.seatsLeft)}
                                </span>
                            </span>
                        )}
                </div>
            </div>
            <div
                className={`flex flex-col items-end gap-2 shrink-0 max-600:flex-row max-600:items-center max-600:shrink ${hasDriver ? "max-600:justify-between" : "max-600:justify-end"}`}
            >
                {hasDriver && (
                    <div className="flex items-center gap-3 self-end max-600:self-auto">
                        <Avatar
                            name={(props as PassengerUpcomingProps).driverName}
                            size="md"
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[15px] font-semibold text-(--color-text-primary) whitespace-nowrap">
                                {(props as PassengerUpcomingProps).driverName}
                            </span>
                            <div className="flex items-center gap-1 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-(--color-dark-yellow) [&_svg]:fill-(--color-dark-yellow) [&_svg]:shrink-0">
                                <StarIcon />
                                <span className="text-[13px] text-(--color-text-secondary)">
                                    {(
                                        props as PassengerUpcomingProps
                                    ).driverRating.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-col items-end gap-2 max-600:items-end">
                    <span className="text-[22px] font-bold text-(--color-text-primary)">
                        {price}€
                    </span>
                    {props.variant === "driver-upcoming" && (
                        <>
                            <div className="flex gap-2">
                                {labels?.viewPassengers !== "" && (
                                    <Button
                                        variant="secondary"
                                        onClick={props.onViewPassengers}
                                    >
                                        {labels?.viewPassengers ??
                                            "View passengers"}
                                    </Button>
                                )}
                                {props.onCompleteRide && (
                                    <Button
                                        variant="outlineSuccess"
                                        className="rounded-lg!"
                                        onClick={props.onCompleteRide}
                                    >
                                        {labels?.completeRide ??
                                            "Complete ride"}
                                    </Button>
                                )}
                                {props.onCancelRide && (
                                    <Button
                                        variant="red"
                                        onClick={props.onCancelRide}
                                    >
                                        {labels?.cancelRide ?? "Cancel ride"}
                                    </Button>
                                )}
                            </div>
                            <span className="text-[13px] text-(--color-text-secondary) text-right">
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
                        <div className="flex gap-2">
                            {props.onSendMessage && (
                                <Button
                                    variant="secondary"
                                    onClick={props.onSendMessage}
                                >
                                    {labels?.messageDriver ?? "Message driver"}
                                </Button>
                            )}
                            {props.status === "pending" && (
                                <Button variant="secondary">
                                    {labels?.pendingConfirmation ??
                                        "Pending confirmation"}
                                </Button>
                            )}
                            <Button
                                variant="red"
                                onClick={props.onCancelBooking}
                            >
                                {labels?.cancelBooking ?? "Cancel booking"}
                            </Button>
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
                        <div className="flex gap-2">
                            <Button
                                variant={
                                    props.alreadyReviewed
                                        ? "secondary"
                                        : "black"
                                }
                                onClick={props.onRateDriver}
                                disabled={props.alreadyReviewed}
                            >
                                {props.alreadyReviewed
                                    ? (labels?.rated ?? "Rated")
                                    : (labels?.rateDriver ?? "Rate driver")}
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
