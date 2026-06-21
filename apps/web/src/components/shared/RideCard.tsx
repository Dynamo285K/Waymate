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
    const passengerActionClassName =
        "min-w-[11rem] justify-center whitespace-normal text-center max-600:w-full";

    function seatsText(count: number) {
        return labels?.seatsLeft
            ? labels.seatsLeft(count)
            : `${count} seats left`;
    }

    return (
        <div
            data-testid="ride-card"
            className="flex flex-col gap-4 py-5 px-6 bg-(--color-card) border border-(--color-border) rounded-2xl max-600:gap-3 max-600:p-4"
        >
            <div className="flex justify-between items-start gap-6 max-600:gap-3">
                <div className="flex flex-col gap-3 min-w-0 flex-1">
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="w-3 h-3 rounded-full border-2 border-(--color-text-primary) shrink-0" />
                            <span className="text-[17px] font-semibold text-(--color-text-primary) min-w-0 break-words">
                                {from}
                            </span>
                        </div>
                        <div className="w-0.5 h-5 bg-(--color-text-secondary) ml-1.25" />
                        <div className="flex items-center gap-2 min-w-0 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-(--color-text-primary) [&_svg]:shrink-0">
                            <MapPinIcon />
                            <span className="text-[17px] font-semibold text-(--color-text-primary) min-w-0 break-words">
                                {to}
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    className={`flex flex-col items-end gap-2 shrink-0 ${hasDriver ? "" : "max-600:items-end"}`}
                >
                    {hasDriver && (
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                                name={
                                    (props as PassengerUpcomingProps).driverName
                                }
                                size="md"
                            />
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[15px] font-semibold text-(--color-text-primary) break-words">
                                    {
                                        (props as PassengerUpcomingProps)
                                            .driverName
                                    }
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
                            {price}
                            {"\u20ac"}
                        </span>

                        {props.variant === "driver-upcoming" && (
                            <>
                                <div className="flex flex-wrap justify-end gap-2">
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
                                            {labels?.cancelRide ??
                                                "Cancel ride"}
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
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between gap-4 max-600:flex-col max-600:items-stretch">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-w-0 [&_svg]:w-4 [&_svg]:h-4 [&_svg]:text-(--color-text-secondary) [&_svg]:shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-sm text-(--color-text-secondary)">
                        <ClockIcon />
                        <span className="break-words">{datetime}</span>
                    </span>
                    {duration && (
                        <span className="text-sm text-(--color-text-secondary)">
                            {"\u00b7 "}
                            {duration}
                        </span>
                    )}
                    {props.variant === "driver-upcoming" && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-(--color-text-secondary)">
                            <UserIcon />
                            <span>
                                {props.seatsLeft === "full"
                                    ? (labels?.full ?? "Full")
                                    : seatsText(props.seatsLeft)}
                            </span>
                        </span>
                    )}
                    {props.variant === "passenger-upcoming" &&
                        props.seatsLeft !== undefined && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-(--color-text-secondary)">
                                <UserIcon />
                                <span>{seatsText(props.seatsLeft)}</span>
                            </span>
                        )}
                </div>

                {props.variant === "passenger-upcoming" && (
                    <div className="flex flex-wrap justify-end gap-2 shrink-0 max-600:flex-col max-600:w-full">
                        {props.onSendMessage && (
                            <Button
                                variant="secondary"
                                className={passengerActionClassName}
                                onClick={props.onSendMessage}
                            >
                                {labels?.messageDriver ?? "Message driver"}
                            </Button>
                        )}
                        {props.status === "pending" && (
                            <Button
                                variant="secondary"
                                className={passengerActionClassName}
                            >
                                {labels?.pendingConfirmation ??
                                    "Pending confirmation"}
                            </Button>
                        )}
                        <Button
                            variant="red"
                            className={passengerActionClassName}
                            onClick={props.onCancelBooking}
                        >
                            {labels?.cancelBooking ?? "Cancel booking"}
                        </Button>
                        {props.status === "confirmed" && props.onReport && (
                            <Button
                                variant="secondary"
                                className={passengerActionClassName}
                                onClick={props.onReport}
                            >
                                {labels?.reportDriver ?? "Report driver"}
                            </Button>
                        )}
                    </div>
                )}

                {props.variant === "passenger-past" && (
                    <div className="flex flex-wrap justify-end gap-2 shrink-0 max-600:flex-col max-600:w-full">
                        <Button
                            variant={
                                props.alreadyReviewed ? "secondary" : "black"
                            }
                            className={passengerActionClassName}
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
                                className={passengerActionClassName}
                                onClick={props.onReport}
                            >
                                {labels?.reportDriver ?? "Report driver"}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
