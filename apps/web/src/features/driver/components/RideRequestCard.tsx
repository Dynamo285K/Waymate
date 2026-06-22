import {
    Avatar,
    Button,
    CheckIcon,
    ClockIcon,
    CloseIcon,
    MapPinIcon,
    StarIcon,
} from "@waymate/ui";

export type RideRequestCardLabels = {
    seatsRequired?: (count: number) => string;
    accept?: string;
    decline?: string;
};

export type RideRequestCardProps = {
    name: string;
    rating: number;
    seatsRequired: number;
    price: number;
    currency: string;
    from: string;
    to: string;
    datetime: string;
    onAccept: () => void;
    onDecline: () => void;
    labels?: RideRequestCardLabels;
};

export function RideRequestCard({
    name,
    rating,
    seatsRequired,
    price,
    currency,
    from,
    to,
    datetime,
    onAccept,
    onDecline,
    labels,
}: RideRequestCardProps) {
    return (
        <div className="flex items-center justify-between gap-6 py-5 px-6 bg-card border border-border rounded-2xl max-sm:flex-wrap max-sm:gap-3 max-sm:p-4">
            <div className="flex items-center gap-4 shrink-0 max-sm:flex-1 max-sm:min-w-0">
                <Avatar
                    name={name}
                    size="lg"
                />
                <div className="flex flex-col gap-0.75">
                    <span className="text-base font-semibold text-text-primary whitespace-nowrap">
                        {name}
                    </span>
                    <div className="flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0">
                        <StarIcon />
                        <span className="text-sm text-text-secondary">
                            {rating.toFixed(1)}
                        </span>
                    </div>
                    <span className="text-sm text-text-secondary whitespace-nowrap">
                        {labels?.seatsRequired
                            ? labels.seatsRequired(seatsRequired)
                            : `${seatsRequired} seat(s) required`}
                    </span>
                </div>
            </div>
            <div className="flex flex-col flex-1 max-sm:w-full max-sm:flex-none">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-text-primary shrink-0" />
                    <span className="text-control font-medium text-text-primary">
                        {from}
                    </span>
                </div>
                <div className="w-0.5 h-5 bg-text-secondary ml-1.25" />
                <div className="flex items-center gap-2 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-text-primary icon-svg:shrink-0">
                    <MapPinIcon />
                    <span className="text-control font-medium text-text-primary">
                        {to}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-text-secondary icon-svg:shrink-0">
                    <ClockIcon />
                    <span className="text-caption text-text-secondary max-sm:whitespace-nowrap">
                        {datetime}
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0 max-sm:w-full">
                <span className="text-xl font-bold text-text-primary">
                    {price}
                    {currency === "EUR" ? "€" : currency}
                </span>
                <div className="flex gap-2 max-sm:w-full max-sm:justify-end">
                    <Button
                        variant="black"
                        leftIcon={<CheckIcon />}
                        onClick={onAccept}
                    >
                        {labels?.accept ?? "Accept"}
                    </Button>
                    <Button
                        variant="red"
                        leftIcon={<CloseIcon />}
                        onClick={onDecline}
                    >
                        {labels?.decline ?? "Decline"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
