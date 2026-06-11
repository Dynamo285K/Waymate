import type { Locale } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button } from "@waymate/ui";
import { RouteSection } from "./RouteSection";
import { ScheduleSection } from "./ScheduleSection";
import { SeatsPriceSection } from "./SeatsPriceSection";
import { CarSection, type CarSectionProps } from "./CarSection";

export type { OfferRideCar } from "./CarSection";

type OfferRideFormProps = {
    car: CarSectionProps;
    dateLocale?: Locale;
    today?: Date;
    publishedMessage?: string;
    onPublishClick?: () => void;
};

export function OfferRideForm({
    car,
    dateLocale,
    today,
    publishedMessage,
    onPublishClick,
}: OfferRideFormProps) {
    const { t } = useTranslation();

    return (
        <div className="w-full max-w-[740px] mx-auto flex flex-col gap-8">
            <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="m-0 text-[32px] font-bold text-(--color-text-primary) leading-10">
                    {t("offerRide.title")}
                </h1>
                <p className="m-0 text-base text-(--color-text-secondary) leading-6">
                    {t("offerRide.subtitle")}
                </p>
            </div>

            <div className="flex flex-col gap-6">
                <RouteSection />
                <ScheduleSection
                    dateLocale={dateLocale}
                    today={today}
                />
                <SeatsPriceSection />
                <CarSection {...car} />
            </div>

            {publishedMessage && (
                <p className="m-0 py-3 px-4 rounded-xl border border-(--color-success-border) bg-(--color-success-bg) text-sm font-semibold text-(--color-success-text)">
                    {publishedMessage}
                </p>
            )}

            <div className="w-full" data-testid="publish-ride-wrapper">
                <Button
                    fullWidth
                    className="min-h-16 text-lg! font-bold! rounded-xl!"
                    onClick={onPublishClick}
                >
                    {t("offerRide.publish")}
                </Button>
            </div>
        </div>
    );
}
