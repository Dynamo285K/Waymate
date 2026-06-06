import { Avatar, Button, StarIcon, ClockIcon, UserIcon } from "@waymate/ui";

export type AvailableRideCardLabels = {
    seatsLeft?: (count: number) => string;
    book?: string;
};

export type AvailableRideCardProps = {
    from: string;
    to: string;
    datetime: string;
    duration?: string;
    seatsLeft: number;
    driverName: string;
    driverRating: number;
    price: number;
    onBook: () => void;
    labels?: AvailableRideCardLabels;
};

export function AvailableRideCard({
    from,
    to,
    datetime,
    duration,
    seatsLeft,
    driverName,
    driverRating,
    price,
    onBook,
    labels,
}: AvailableRideCardProps) {
    const seatsText = labels?.seatsLeft
        ? labels.seatsLeft(seatsLeft)
        : `${seatsLeft} seats left`;

    return (
        <div className="flex justify-between items-center gap-6 px-6 py-4 bg-(--color-card) border border-(--color-border) rounded-2xl max-600:flex-wrap max-600:gap-3 max-600:py-3.5 max-600:px-4">
            <div className="flex flex-col justify-center gap-1.5 flex-1 self-center max-600:w-full">
                <span className="text-base font-bold text-(--color-text-primary)">
                    {from} → {to}
                </span>
                <div className="flex items-center gap-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-(--color-text-secondary) [&_svg]:shrink-0">
                    <ClockIcon />
                    <span className="text-[13px] text-(--color-text-secondary) max-600:whitespace-nowrap">
                        {datetime}
                    </span>
                    {duration && (
                        <span className="text-[13px] text-(--color-text-secondary)">
                            · {duration}
                        </span>
                    )}
                    <span className="ml-2 flex items-center gap-1.5">
                        <UserIcon />
                        <span className="text-[13px] text-(--color-text-secondary) max-600:whitespace-nowrap">
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
                    <span className="text-[15px] font-semibold text-(--color-text-primary) whitespace-nowrap">
                        {driverName}
                    </span>
                    <div className="flex items-center gap-1 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-(--color-dark-yellow) [&_svg]:fill-(--color-dark-yellow) [&_svg]:shrink-0">
                        <StarIcon />
                        <span className="text-[13px] text-(--color-text-secondary)">
                            {driverRating.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 self-center max-600:ml-auto max-600:gap-3">
                <span className="text-[22px] font-bold text-(--color-text-primary)">
                    {price}€
                </span>
                <Button
                    variant="black"
                    onClick={onBook}
                >
                    {labels?.book ?? "Book"}
                </Button>
            </div>
        </div>
    );
}
