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
        <div className="w-full bg-card rounded-summary-card py-5 px-summary-content-x shadow-card flex items-center justify-between gap-6 max-900:flex-col max-900:items-stretch">
            <div className="flex flex-col gap-4 min-w-0">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center text-text-secondary icon-svg:w-5.5 icon-svg:h-5.5">
                            <CircleIcon />
                        </span>
                        <span className="text-lg font-bold text-text-primary leading-7">
                            {pickup}
                        </span>
                    </div>
                    <span className="ml-summary-divider text-border ">
                        <VerticalLineIcon />
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center text-text-secondary icon-svg:w-5.5 icon-svg:h-5.5">
                            <MapPinIcon />
                        </span>
                        <span className="text-lg font-bold text-text-primary leading-7">
                            {dropoff}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-summary-gap flex-wrap">
                    <div className="inline-flex items-center gap-2 text-text-secondary text-sm leading-5 icon-svg:w-4.5 icon-svg:h-4.5">
                        <ClockIcon />
                        <span>{dateTime}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-text-secondary text-sm leading-5 icon-svg:w-4.5 icon-svg:h-4.5">
                        <UserIcon />
                        <span>{seatsLeft}</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end gap-summary-gap shrink-0 max-900:items-stretch">
                <div className="text-panel-title font-bold text-text-primary leading-9">
                    {price}
                </div>
                <div className="flex items-center gap-3 max-900:flex-col max-900:items-stretch">
                    <Button
                        className="min-w-summary-action-min max-900:w-full"
                        onClick={onManageClick}
                    >
                        Manage
                    </Button>
                    <Button
                        variant="red"
                        className="min-w-summary-action-min max-900:w-full"
                        onClick={onCancelClick}
                    >
                        Cancel ride
                    </Button>
                </div>
            </div>
        </div>
    );
}
