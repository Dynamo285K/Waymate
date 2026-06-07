import { Avatar, Button, StarIcon, MapPinIcon, ClockIcon } from "@waymate/ui";

export type RideRequestCardLabels = {
    seatsRequired?: (count: number) => string;
    accept?: string;
    decline?: string;
};

export type RideRequestCardProps = {
    name: string;
    rating: number;
    seatsRequired: number;
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
    from,
    to,
    datetime,
    onAccept,
    onDecline,
    labels,
}: RideRequestCardProps) {
    return (
        <div className="flex items-center justify-between gap-6 py-5 px-6 bg-(--color-card) border border-(--color-border) rounded-2xl max-sm:flex-wrap max-sm:gap-3 max-sm:p-4">
            <div className="flex items-center gap-4 shrink-0 max-sm:flex-1 max-sm:min-w-0">
                <Avatar
                    name={name}
                    size="lg"
                />
                <div className="flex flex-col gap-0.75">
                    <span className="text-base font-semibold text-(--color-text-primary) whitespace-nowrap">
                        {name}
                    </span>
                    <div className="flex items-center gap-1 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-(--color-dark-yellow) [&_svg]:fill-(--color-dark-yellow) [&_svg]:shrink-0">
                        <StarIcon />
                        <span className="text-sm text-(--color-text-secondary)">
                            {rating}
                        </span>
                    </div>
                    <span className="text-sm text-(--color-text-secondary) whitespace-nowrap">
                        {labels?.seatsRequired
                            ? labels.seatsRequired(seatsRequired)
                            : `${seatsRequired} seat(s) required`}
                    </span>
                </div>
            </div>
            <div className="flex flex-col flex-1 max-sm:w-full max-sm:flex-none">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-(--color-text-primary) shrink-0" />
                    <span className="text-[15px] font-medium text-(--color-text-primary)">
                        {from}
                    </span>
                </div>
                <div className="w-0.5 h-5 bg-(--color-text-secondary) ml-1.25" />
                <div className="flex items-center gap-2 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-(--color-text-primary) [&_svg]:shrink-0">
                    <MapPinIcon />
                    <span className="text-[15px] font-medium text-(--color-text-primary)">
                        {to}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-(--color-text-secondary) [&_svg]:shrink-0">
                    <ClockIcon />
                    <span className="text-[13px] text-(--color-text-secondary) max-sm:whitespace-nowrap">
                        {datetime}
                    </span>
                </div>
            </div>
            <div className="flex gap-2 shrink-0 max-sm:w-full max-sm:justify-end">
                <Button
                    variant="black"
                    onClick={onAccept}
                >
                    ✓ {labels?.accept ?? "Accept"}
                </Button>
                <Button
                    variant="red"
                    onClick={onDecline}
                >
                    ✕ {labels?.decline ?? "Decline"}
                </Button>
            </div>
        </div>
    );
}
