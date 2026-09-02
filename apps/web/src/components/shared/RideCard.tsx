import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { CircleIcon } from "@/components/ui/icons/CircleIcon";
import { ClockIcon } from "@/components/ui/icons/ClockIcon";
import { MapPinIcon } from "@/components/ui/icons/MapPinIcon";
import { StarIcon } from "@/components/ui/icons/StarIcon";
import { UserIcon } from "@/components/ui/icons/UserIcon";
import { DriverUpcomingActions } from "./ride-card/DriverUpcomingActions";
import { PassengerUpcomingActions } from "./ride-card/PassengerUpcomingActions";
import { PassengerPastActions } from "./ride-card/PassengerPastActions";

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
    viewDetails?: string;
    cancelled?: string;
    rejected?: string;
    noShow?: string;
    cancelledByYou?: string;
    cancelledByDriver?: string;
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
    onSendMessage?: () => void;
    onViewDetails?: () => void;
};
type PassengerPastProps = RideCardBaseProps & {
    variant: "passenger-past";
    driverName: string;
    driverRating: number;
    onRateDriver: () => void;
    alreadyReviewed?: boolean;
    onReport?: () => void;
    cancelledByUserId?: string | null;
    currentUserId?: string | null;
    bookingStatus?:
        | "CONFIRMED"
        | "COMPLETED"
        | "REJECTED"
        | "CANCELLED"
        | "NO_SHOW"
        | "PENDING";
};

export type RideCardProps =
    | DriverUpcomingProps
    | DriverPastProps
    | PassengerUpcomingProps
    | PassengerPastProps;

export function RideCard(props: RideCardProps) {
    const { from, to, datetime, price, duration, labels } = props;

    const metaRowClassName =
        "flex items-center gap-1.5 text-sm text-text-secondary icon-svg:w-4 icon-svg:h-4 icon-svg:text-text-secondary icon-svg:shrink-0";

    function seatsText(count: number) {
        return labels?.seatsLeft
            ? labels.seatsLeft(count)
            : `${count} seats left`;
    }

    // Passenger-upcoming gets its own compact, two-column layout (route + meta
    // on the left, driver/price/actions on the right) instead of the two
    // stacked rows the other variants use — that's what keeps this card short.
    if (props.variant === "passenger-upcoming") {
        return (
            <div
                data-testid="ride-card"
                className="flex flex-col py-4 px-5 bg-card border border-border rounded-2xl max-600:p-4"
            >
                {/* Mobile Header: Meta + Price */}
                <div className="hidden max-600:flex justify-between items-center mb-4">
                    <div className="flex flex-col gap-1">
                        <span className={metaRowClassName}>
                            <ClockIcon />
                            <span className="break-words">{datetime}</span>
                        </span>
                    </div>
                    <span className="text-subtitle font-bold text-text-primary">
                        {price}
                        {"€"}
                    </span>
                </div>

                <div className="flex justify-between items-stretch gap-6 max-600:flex-col max-600:gap-4">
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-3 h-3 rounded-full border-2 border-text-primary shrink-0" />
                                <span className="text-route font-semibold text-text-primary min-w-0 break-words">
                                    {from}
                                </span>
                            </div>
                            <div className="w-0.5 h-5 bg-text-secondary ml-1.25" />
                            <div className="flex items-center gap-2 min-w-0 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-text-primary icon-svg:shrink-0">
                                <MapPinIcon />
                                <span className="text-route font-semibold text-text-primary min-w-0 break-words">
                                    {to}
                                </span>
                            </div>
                        </div>

                        {props.onViewDetails && (
                            <TextLink
                                variant="muted"
                                onClick={props.onViewDetails}
                                className="self-start max-600:hidden"
                            >
                                {labels?.viewDetails ?? "View details"}
                            </TextLink>
                        )}

                        <div className="flex flex-col gap-1 mt-1 max-600:hidden">
                            <span className={metaRowClassName}>
                                <ClockIcon />
                                <span className="break-words">{datetime}</span>
                            </span>
                            {duration && (
                                <span className={metaRowClassName}>
                                    <CircleIcon />
                                    <span className="break-words">
                                        {duration}
                                    </span>
                                </span>
                            )}
                            {props.seatsLeft !== undefined && (
                                <span className={metaRowClassName}>
                                    <UserIcon />
                                    <span>{seatsText(props.seatsLeft)}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="hidden max-600:block h-px bg-border w-full" />

                    <div className="flex flex-col items-end justify-between gap-3 shrink-0 max-600:flex-row max-600:items-center">
                        <div className="flex flex-col items-end gap-2 max-600:flex-row max-600:items-center">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar
                                    name={props.driverName}
                                    size="md"
                                />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-control font-semibold text-text-primary break-words">
                                        {props.driverName}
                                    </span>
                                    <div className="flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0">
                                        <StarIcon />
                                        <span className="text-caption text-text-secondary">
                                            {props.driverRating.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-subtitle font-bold text-text-primary max-600:hidden">
                                {price}
                                {"€"}
                            </span>
                        </div>

                        <PassengerUpcomingActions
                            labels={labels}
                            status={props.status}
                            onSendMessage={props.onSendMessage}
                            onCancelBooking={props.onCancelBooking}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Passenger-past uses the same compact two-column layout as
    // passenger-upcoming (route/meta on the left, driver/price/actions on the
    // right) so both cards are the same short height.
    if (props.variant === "passenger-past") {
        return (
            <div
                data-testid="ride-card"
                className="flex flex-col py-4 px-5 bg-card border border-border rounded-2xl max-600:p-4"
            >
                {/* Mobile Header: Meta + Price */}
                <div className="hidden max-600:flex justify-between items-center mb-4">
                    <div className="flex flex-col gap-1">
                        <span className={metaRowClassName}>
                            <ClockIcon />
                            <span className="break-words">{datetime}</span>
                        </span>
                    </div>
                    <span className="text-subtitle font-bold text-text-primary">
                        {price}
                        {"€"}
                    </span>
                </div>

                <div className="flex justify-between items-stretch gap-6 max-600:flex-col max-600:gap-4">
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-3 h-3 rounded-full border-2 border-text-primary shrink-0" />
                                <span className="text-route font-semibold text-text-primary min-w-0 break-words">
                                    {from}
                                </span>
                            </div>
                            <div className="w-0.5 h-5 bg-text-secondary ml-1.25" />
                            <div className="flex items-center gap-2 min-w-0 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-text-primary icon-svg:shrink-0">
                                <MapPinIcon />
                                <span className="text-route font-semibold text-text-primary min-w-0 break-words">
                                    {to}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-1 max-600:hidden">
                            <span className={metaRowClassName}>
                                <ClockIcon />
                                <span className="break-words">{datetime}</span>
                            </span>
                            {duration && (
                                <span className={metaRowClassName}>
                                    <CircleIcon />
                                    <span className="break-words">
                                        {duration}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="hidden max-600:block h-px bg-border w-full" />

                    <div className="flex flex-col items-end justify-between gap-3 shrink-0 max-600:flex-row max-600:items-center">
                        <div className="flex flex-col items-end gap-2 max-600:flex-row max-600:items-center">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar
                                    name={props.driverName}
                                    size="md"
                                />
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-control font-semibold text-text-primary break-words">
                                        {props.driverName}
                                    </span>
                                    <div className="flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0">
                                        <StarIcon />
                                        <span className="text-caption text-text-secondary">
                                            {props.driverRating.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-subtitle font-bold text-text-primary max-600:hidden">
                                {price}
                                {"€"}
                            </span>
                        </div>

                        <PassengerPastActions
                            labels={labels}
                            alreadyReviewed={props.alreadyReviewed}
                            bookingStatus={props.bookingStatus}
                            cancelledByUserId={props.cancelledByUserId}
                            currentUserId={props.currentUserId}
                            onRateDriver={props.onRateDriver}
                            onReport={props.onReport}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            data-testid="ride-card"
            className="flex flex-col py-4 px-5 bg-card border border-border rounded-2xl max-600:p-4"
        >
            {/* Mobile Header: Datetime + Price */}
            <div className="hidden max-600:flex justify-between items-center mb-4">
                <div className="flex flex-col gap-1">
                    <span className={metaRowClassName}>
                        <ClockIcon />
                        <span className="break-words">{datetime}</span>
                    </span>
                </div>
                <span className="text-subtitle font-bold text-text-primary">
                    {price}
                    {"€"}
                </span>
            </div>

            <div className="flex justify-between items-stretch gap-6 max-600:flex-col max-600:gap-4">
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                    {/* Route */}
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="w-3 h-3 rounded-full border-2 border-text-primary shrink-0" />
                            <span className="text-route font-semibold text-text-primary min-w-0 break-words">
                                {from}
                            </span>
                        </div>
                        <div className="w-0.5 h-5 bg-text-secondary ml-1.25" />
                        <div className="flex items-center gap-2 min-w-0 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-text-primary icon-svg:shrink-0">
                            <MapPinIcon />
                            <span className="text-route font-semibold text-text-primary min-w-0 break-words">
                                {to}
                            </span>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col gap-1 mt-1">
                        <span className={`max-600:hidden ${metaRowClassName}`}>
                            <ClockIcon />
                            <span className="break-words">{datetime}</span>
                        </span>
                        {duration && (
                            <span className={metaRowClassName}>
                                <CircleIcon />
                                <span className="break-words">{duration}</span>
                            </span>
                        )}
                        {props.variant === "driver-upcoming" && (
                            <span className={metaRowClassName}>
                                <UserIcon />
                                <span>
                                    {props.seatsLeft === "full"
                                        ? (labels?.full ?? "Full")
                                        : seatsText(props.seatsLeft)}
                                </span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Mobile Divider */}
                <div className="hidden max-600:block h-px bg-border w-full" />

                <div className="flex flex-col items-end justify-between gap-3 shrink-0 max-600:flex-row max-600:items-center">
                    <div className="flex flex-col items-end gap-2 max-600:hidden">
                        <span className="text-subtitle font-bold text-text-primary">
                            {price}
                            {"€"}
                        </span>
                    </div>

                    <div className="flex flex-col items-end gap-3 max-600:w-full max-600:flex-row max-600:justify-end">
                        {props.variant === "driver-upcoming" && (
                            <DriverUpcomingActions
                                labels={labels}
                                onViewPassengers={props.onViewPassengers}
                                onCompleteRide={props.onCompleteRide}
                                onCancelRide={props.onCancelRide}
                            />
                        )}
                        {props.variant === "driver-past" && (
                            <Button
                                variant="black"
                                onClick={props.onRatePassengers}
                                className="max-600:w-full"
                            >
                                {labels?.ratePassengers ?? "Rate passengers"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
