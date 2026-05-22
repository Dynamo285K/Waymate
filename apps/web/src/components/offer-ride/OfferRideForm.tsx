import type { Locale } from "date-fns";
import { useTranslation } from "react-i18next";
import { Button } from "@waymate/ui";
import { RouteSection } from "./RouteSection";
import { ScheduleSection } from "./ScheduleSection";
import { SeatsPriceSection } from "./SeatsPriceSection";
import { CarSection, type CarSectionProps } from "./CarSection";
import "../OfferRideForm.css";

export type { OfferRideCar } from "./CarSection";

type OfferRideFormProps = {
    // Car-picker state lives in the page (useDriverCars); the rest of the form
    // reads/writes RHF state through context, so this component must be
    // rendered inside a FormProvider.
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
        <div className="offer-ride-form">
            <div className="offer-ride-form__header">
                <h1 className="offer-ride-form__title">
                    {t("offerRide.title")}
                </h1>
                <p className="offer-ride-form__subtitle">
                    {t("offerRide.subtitle")}
                </p>
            </div>

            <div className="offer-ride-form__sections">
                <RouteSection />
                <ScheduleSection
                    dateLocale={dateLocale}
                    today={today}
                />
                <SeatsPriceSection />
                <CarSection {...car} />
            </div>

            {publishedMessage && (
                <p className="offer-ride-form__published">{publishedMessage}</p>
            )}

            <div className="offer-ride-form__actions">
                <Button
                    fullWidth
                    onClick={onPublishClick}
                >
                    {t("offerRide.publish")}
                </Button>
            </div>
        </div>
    );
}
