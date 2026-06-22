import { useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cs, enUS, sk as skLocale } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { OfferRideForm } from "./-components/OfferRideForm";
import {
    offerRideSchema,
    type OfferRideFormInput,
    type OfferRideFormValues,
} from "./-components/schema";
import { useDriverCars } from "./-hooks/useDriverCars";
import { useEtaPreview } from "./-hooks/useEtaPreview";
import { useCarCatalogOptions } from "./-hooks/useCarCatalogOptions";
import { useOfferRideSubmit } from "./-hooks/useOfferRideSubmit";
import { toUiLanguage } from "../../../lib/language";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/driver/offer/")({
    component: DriverOfferRidePage,
});

const LOCALES = {
    en: enUS,
    sk: skLocale,
    cs,
} as const;

function DriverOfferRidePage() {
    const { t } = useTranslation();
    const { language, theme } = useLayout();

    const methods = useForm<OfferRideFormInput, unknown, OfferRideFormValues>({
        resolver: zodResolver(offerRideSchema),
        defaultValues: {
            pickupCity: null,
            dropoffCity: null,
            rideDate: undefined,
            rideTime: "",
            seats: "",
            price: "",
            manualBrand: "",
            manualModel: "",
            manualPlate: "",
        },
    });
    const { control, handleSubmit, setError, clearErrors } = methods;

    // Subscribe to exactly the fields the page reacts to (ETA preview, the car
    // hook, the publish-error reset key) via useWatch rather than the form-level
    // watch() — the explicit name list keeps the subscription scoped and matches
    // the pattern used by the auth forms.
    const [
        pickupCity,
        dropoffCity,
        rideDate,
        rideTime,
        seats,
        price,
        manualBrand,
        manualModel,
        manualPlate,
    ] = useWatch({
        control,
        name: [
            "pickupCity",
            "dropoffCity",
            "rideDate",
            "rideTime",
            "seats",
            "price",
            "manualBrand",
            "manualModel",
            "manualPlate",
        ],
    });

    // Car picker state (saved cars, mode, selection) and its render-time
    // syncs live in the hook.
    const car = useDriverCars({ manualBrand, manualModel, manualPlate });

    const etaPreview = useEtaPreview({
        pickupCity,
        dropoffCity,
        rideDate,
        rideTime,
    });

    const carOptions = useCarCatalogOptions(manualBrand);

    const { onSubmit, publishError, publishedMessage } = useOfferRideSubmit({
        values: {
            pickupCity,
            dropoffCity,
            rideDate,
            rideTime,
            seats,
            price,
            manualBrand,
            manualModel,
            manualPlate,
        },
        car,
        etaPreview,
        modelsData: carOptions.modelsData,
        setError,
    });

    const offerRideToday = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }, []);

    function handleCarModeChange(mode: "saved" | "manual") {
        car.selectCarMode(mode);
        clearErrors(["manualBrand", "manualModel", "manualPlate"]);
    }

    const datePickerLocale =
        LOCALES[language as keyof typeof LOCALES] ??
        LOCALES[toUiLanguage(language) as keyof typeof LOCALES] ??
        enUS;

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <div className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <FormProvider {...methods}>
                    <OfferRideForm
                        dateLocale={datePickerLocale}
                        today={offerRideToday}
                        etaPreview={etaPreview}
                        car={{
                            savedCars: car.driverCars,
                            carMode: car.carMode,
                            onCarModeChange: handleCarModeChange,
                            selectedCarId: car.selectedCarId,
                            onSelectedCarChange: car.setSelectedCarId,
                            brandOptions: carOptions.brandOptions,
                            brandLoading: carOptions.brandLoading,
                            modelOptions: carOptions.modelOptions,
                            modelLoading: carOptions.modelLoading,
                        }}
                        publishedMessage={
                            publishedMessage ? t(publishedMessage) : ""
                        }
                        onPublishClick={handleSubmit(onSubmit)}
                    />
                </FormProvider>
                {publishError && (
                    <p className="mt-4 w-full rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-text">
                        {t(publishError)}
                    </p>
                )}
            </div>
        </div>
    );
}
