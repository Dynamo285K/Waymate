import { Avatar, Button, StarIcon, ClockIcon, UserIcon } from "@waymate/ui";

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
        <div className="available-ride-card flex justify-between items-center gap-6 px-6 py-4 bg-card border border-border rounded-2xl max-600:flex-wrap max-600:gap-3 max-600:py-3.5 max-600:px-4">
            <div className="flex flex-col justify-center gap-1.5 flex-1 self-center max-600:w-full">
                <span className="text-base font-bold text-text-primary">
                    {from} → {to}
                </span>
                {showFullRoute && (
                    <span className="text-sm text-text-secondary">
                        {originalStartCity} → {originalEndCity}
                    </span>
                )}
                <div className="flex items-center gap-1.5 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-text-secondary icon-svg:shrink-0">
                    <ClockIcon />
                    <span className="text-caption text-text-secondary max-600:whitespace-nowrap">
                        {datetime}
                    </span>
                    {duration && (
                        <span className="text-caption text-text-secondary">
                            · {duration}
                        </span>
                    )}
                    <span className="ml-2 flex items-center gap-1.5">
                        <UserIcon />
                        <span className="text-caption text-text-secondary max-600:whitespace-nowrap">
                            {seatsText}
                        </span>
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-center max-600:flex-1">
                <Avatar
                    name={driverName}
                    size="sm"
                />
                <div className="flex flex-col gap-0.5">
                    <span className="text-control font-semibold text-text-primary whitespace-nowrap">
                        {driverName}
                    </span>
                    <div className="flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0">
                        <StarIcon />
                        <span className="text-caption text-text-secondary">
                            {driverRating.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 self-center max-600:ml-auto max-600:gap-3">
                <span className="text-subtitle font-bold text-text-primary">
                    {price}€
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
    );
}
