import {
    Avatar,
    Button,
    CircleIcon,
    ClockIcon,
    StarIcon,
    UserIcon,
} from "@waymate/ui";

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

    return (
        <div className="available-ride-card text-left flex items-center justify-between gap-6 px-6 py-4 bg-card border border-border rounded-2xl max-600:items-start max-600:gap-4 max-600:px-5">
            <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-2 self-center max-600:self-start">
                <span className="text-base font-bold text-text-primary">
                    {from} &rarr; {to}
                </span>
                {showFullRoute && (
                    <span className="text-sm text-text-secondary">
                        {originalStartCity} &rarr; {originalEndCity}
                    </span>
                )}
                <div className="available-ride-card-meta icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-text-secondary icon-svg:shrink-0">
                    <span className="available-ride-card-meta-row">
                        <ClockIcon />
                        <span className="text-caption text-text-secondary">
                            {datetime}
                        </span>
                    </span>
                    {duration && (
                        <span className="available-ride-card-meta-row">
                            <CircleIcon />
                            <span className="text-caption text-text-secondary">
                                {duration}
                            </span>
                        </span>
                    )}
                    <span className="available-ride-card-meta-row">
                        <UserIcon />
                        <span className="text-caption text-text-secondary">
                            {seatsText}
                        </span>
                    </span>
                </div>
            </div>

            <div className="flex min-w-0 shrink-0 items-center gap-10 self-center max-600:flex-col max-600:items-end max-600:self-stretch max-600:justify-between max-600:gap-5">
                <div className="flex w-40 min-w-0 items-center gap-2.5 max-600:w-auto max-600:justify-end">
                    <Avatar
                        name={driverName}
                        size="sm"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-control font-semibold text-text-primary break-words max-600:text-right">
                            {driverName}
                        </span>
                        <div className="flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0 max-600:justify-end">
                            <StarIcon />
                            <span className="text-caption text-text-secondary">
                                {driverRating.toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex w-36 shrink-0 items-center justify-end gap-4 max-600:w-auto max-600:gap-3">
                    <span className="text-subtitle font-bold text-text-primary">
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
