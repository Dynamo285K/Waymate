import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CircleIcon } from "@/components/ui/icons/CircleIcon";
import { ClockIcon } from "@/components/ui/icons/ClockIcon";
import { MapPinIcon } from "@/components/ui/icons/MapPinIcon";
import { StarIcon } from "@/components/ui/icons/StarIcon";
import { UserIcon } from "@/components/ui/icons/UserIcon";

export type AvailableRideCardLabels = {
    seatsLeft?: (count: number) => string;
    full?: string;
    book?: string;
};

export type AvailableRideCardProps = {
    from: string;
    to: string;
    originalStartCity?: string;
    originalEndCity?: string;
    datetime: string;
    duration?: string;
    seatsLeft: number;
    driverName: string;
    driverRating: number;
    price: number;
    canBook?: boolean;
    onBook: () => void;
    labels?: AvailableRideCardLabels;
};

export function AvailableRideCard({
    from,
    to,
    originalStartCity,
    originalEndCity,
    datetime,
    duration,
    seatsLeft,
    driverName,
    driverRating,
    price,
    canBook,
    onBook,
    labels,
}: AvailableRideCardProps) {
    const isFull = seatsLeft <= 0;
    const seatsText = isFull
        ? (labels?.full ?? "Full")
        : labels?.seatsLeft
          ? labels.seatsLeft(seatsLeft)
          : `${seatsLeft} seats left`;

    const showFullRoute =
        originalStartCity &&
        originalEndCity &&
        (originalStartCity !== from || originalEndCity !== to);
    const metaRowClassName =
        "flex items-center gap-1.5 text-caption text-text-secondary icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-text-secondary icon-svg:shrink-0";

    return (
        <div className="available-ride-card text-left flex items-center justify-between gap-6 px-6 py-4 bg-card border border-border rounded-2xl max-600:flex-col max-600:items-stretch max-600:gap-4 max-600:px-5">
            {/* Mobile Header: Datetime + Price */}
            <div className="hidden max-600:flex justify-between items-center mb-1">
                <div className="flex flex-col gap-1">
                    <span className={metaRowClassName}>
                        <ClockIcon />
                        <span className="break-words">{datetime}</span>
                    </span>
                </div>
                <span className="text-subtitle font-bold text-text-primary">
                    {price}&euro;
                </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-2 self-center max-600:self-stretch">
                {/* Desktop Route (Inline) */}
                <div className="max-600:hidden">
                    <span className="text-base font-bold text-text-primary">
                        {from} &rarr; {to}
                    </span>
                    {showFullRoute && (
                        <span className="text-sm text-text-secondary block mt-1">
                            {originalStartCity} &rarr; {originalEndCity}
                        </span>
                    )}
                </div>

                {/* Mobile Route (Vertical with Pins) */}
                <div className="hidden max-600:flex flex-col min-w-0 w-full">
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
                    {showFullRoute && (
                        <span className="text-sm text-text-secondary block mt-2">
                            {originalStartCity} &rarr; {originalEndCity}
                        </span>
                    )}
                </div>

                <div className="flex flex-col items-start gap-1 mt-1 max-600:mt-2">
                    <span className={`max-600:hidden ${metaRowClassName}`}>
                        <ClockIcon />
                        <span>{datetime}</span>
                    </span>
                    {duration && (
                        <span className={metaRowClassName}>
                            <CircleIcon />
                            <span>{duration}</span>
                        </span>
                    )}
                    <span className={metaRowClassName}>
                        <UserIcon />
                        <span>{seatsText}</span>
                    </span>
                </div>
            </div>

            {/* Mobile Divider */}
            <div className="hidden max-600:block h-px bg-border w-full" />

            <div className="flex min-w-0 shrink-0 items-center gap-10 self-center max-600:flex-row max-600:items-center max-600:self-stretch max-600:justify-between max-600:gap-3">
                <div className="flex w-40 min-w-0 items-center gap-2.5 max-600:w-auto">
                    <Avatar
                        name={driverName}
                        size="sm"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-control font-semibold text-text-primary break-words max-600:text-left">
                            {driverName}
                        </span>
                        <div className="flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0 max-600:justify-start">
                            <StarIcon />
                            <span className="text-caption text-text-secondary">
                                {driverRating.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex w-36 shrink-0 items-center justify-end gap-4 max-600:w-auto max-600:gap-3">
                    <span className="text-subtitle font-bold text-text-primary max-600:hidden">
                        {price}&euro;
                    </span>
                    <Button
                        variant="black"
                        onClick={onBook}
                        disabled={canBook === false || isFull}
                    >
                        {labels?.book ?? "Book"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
