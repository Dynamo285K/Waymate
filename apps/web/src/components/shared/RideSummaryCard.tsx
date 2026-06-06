import {
    Button,
    CircleIcon,
    ClockIcon,
    MapPinIcon,
    UserIcon,
    VerticalLineIcon,
} from "@waymate/ui";

export type RideSummaryCardProps = {
    pickup: string;
    dropoff: string;
    dateTime: string;
    seatsLeft: string;
    price: string;
    onManageClick?: () => void;
    onCancelClick?: () => void;
};

export function RideSummaryCard({
    pickup,
    dropoff,
    dateTime,
    seatsLeft,
    price,
    onManageClick,
    onCancelClick,
}: RideSummaryCardProps) {
    return (
        <div className="w-full bg-(--color-card) rounded-[18px] py-5 px-[22px] shadow-[0_6px_18px_rgba(16,24,40,0.12)] flex items-center justify-between gap-6 max-900:flex-col max-900:items-stretch">
            <div className="flex flex-col gap-4 min-w-0">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center text-(--color-text-secondary) [&_svg]:w-[22px] [&_svg]:h-[22px]">
                            <CircleIcon />
                        </span>
                        <span className="text-lg font-bold text-(--color-text-primary) leading-7">
                            {pickup}
                        </span>
                    </div>
                    <span className="ml-[10px] text-(--color-border) [&_svg]:w-0.5 [&_svg]:h-6">
                        <VerticalLineIcon />
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center text-(--color-text-secondary) [&_svg]:w-[22px] [&_svg]:h-[22px]">
                            <MapPinIcon />
                        </span>
                        <span className="text-lg font-bold text-(--color-text-primary) leading-7">
                            {dropoff}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-[18px] flex-wrap">
                    <div className="inline-flex items-center gap-2 text-(--color-text-secondary) text-sm leading-5 [&_svg]:w-[18px] [&_svg]:h-[18px]">
                        <ClockIcon />
                        <span>{dateTime}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-(--color-text-secondary) text-sm leading-5 [&_svg]:w-[18px] [&_svg]:h-[18px]">
                        <UserIcon />
                        <span>{seatsLeft}</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end gap-[18px] shrink-0 max-900:items-stretch">
                <div className="text-[28px] font-bold text-(--color-text-primary) leading-9">
                    {price}
                </div>
                <div className="flex items-center gap-3 max-900:flex-col max-900:items-stretch">
                    <Button
                        className="min-w-[130px] max-900:w-full"
                        onClick={onManageClick}
                    >
                        Manage
                    </Button>
                    <Button
                        variant="red"
                        className="min-w-[130px] max-900:w-full"
                        onClick={onCancelClick}
                    >
                        Cancel ride
                    </Button>
                </div>
            </div>
        </div>
    );
}
