import { useState } from "react";
import { useForm } from "react-hook-form";
import { cs, enUS, sk as skLocale } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { DriverNavbar, Button, OfferRideForm } from "@waymate/ui";
import type { Language, OfferRideCar } from "@waymate/ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { toUiLanguage } from "../lib/language";

type Props = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (l: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type FormValues = {
    pickup: string;
    dropoff: string;
    date: Date | undefined;
    time: string;
    seats: string;
    price: string;
    carMode: "saved" | "manual";
    selectedCarId: string;
    manualBrand: string;
    manualModel: string;
    manualPlate: string;
};

const INITIAL_DRIVER_CARS: OfferRideCar[] = [
    {
        id: "skoda-fabia-ba123ab",
        brand: "Skoda",
        model: "Fabia",
        plate: "BA-123AB",
    },
    {
        id: "vw-golf-za214ef",
        brand: "Volkswagen",
        model: "Golf",
        plate: "ZA-214EF",
    },
];

const LOCALES = {
    en: enUS,
    sk: skLocale,
    cs,
} as const;

const OFFER_RIDE_TODAY = new Date(2026, 3, 26);

export function DriverOfferRidePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: Props) {
    const { t } = useTranslation();
    const navbarProps = useDriverNavbarProps({
        activeTab: "offer-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const [driverCars, setDriverCars] =
        useState<OfferRideCar[]>(INITIAL_DRIVER_CARS);
    const [showSaveCarPrompt, setShowSaveCarPrompt] = useState(false);
    const [publishedMessage, setPublishedMessage] = useState("");

    const { watch, setValue, setError, clearErrors, formState } =
        useForm<FormValues>({
            defaultValues: {
                pickup: "",
                dropoff: "",
                date: undefined,
                time: "",
                seats: "",
                price: "",
                carMode: INITIAL_DRIVER_CARS.length > 0 ? "saved" : "manual",
                selectedCarId: INITIAL_DRIVER_CARS[0]?.id ?? "",
                manualBrand: "",
                manualModel: "",
                manualPlate: "",
            },
        });

    const pickup = watch("pickup");
    const dropoff = watch("dropoff");
    const date = watch("date");
    const time = watch("time");
    const seats = watch("seats");
    const price = watch("price");
    const carMode = watch("carMode");
    const selectedCarId = watch("selectedCarId");
    const manualBrand = watch("manualBrand");
    const manualModel = watch("manualModel");
    const manualPlate = watch("manualPlate");

    const datePickerLocale =
        LOCALES[language as keyof typeof LOCALES] ??
        LOCALES[toUiLanguage(language) as keyof typeof LOCALES] ??
        enUS;

    function publishRide() {
        setShowSaveCarPrompt(false);
        setPublishedMessage(t("offerRide.published"));
    }

    function handlePublish() {
        setPublishedMessage("");
        clearErrors();

        if (
            carMode === "manual" &&
            manualBrand.trim() &&
            manualModel.trim() &&
            manualPlate.trim()
        ) {
            const plate = manualPlate.trim().toUpperCase();
            if (!/^[A-Z0-9-]+$/.test(plate)) {
                setError("manualPlate", {
                    message: t(
                        "offerRide.invalidPlate",
                        "Use only letters, numbers and dashes"
                    ),
                });
                return;
            }
            const alreadySaved = driverCars.some(
                (car) =>
                    car.brand.toLowerCase() ===
                        manualBrand.trim().toLowerCase() &&
                    car.model.toLowerCase() ===
                        manualModel.trim().toLowerCase() &&
                    car.plate.toUpperCase() === plate
            );
            if (!alreadySaved) {
                setShowSaveCarPrompt(true);
                return;
            }
        }

        publishRide();
    }

    function handleSaveManualCar() {
        const brand = manualBrand.trim();
        const model = manualModel.trim();
        const plate = manualPlate.trim().toUpperCase();

        if (brand && model && plate) {
            const newCar: OfferRideCar = {
                id: `${brand}-${model}-${plate}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-"),
                brand,
                model,
                plate,
            };
            setDriverCars((cars) => [...cars, newCar]);
            setValue("selectedCarId", newCar.id);
            setValue("carMode", "saved");
        }

        publishRide();
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <OfferRideForm
                    labels={{
                        title: t("offerRide.title"),
                        subtitle: t("offerRide.subtitle"),
                        routeSection: t("offerRide.route"),
                        pickup: t("offerRide.pickup"),
                        pickupPlaceholder: t("offerRide.pickupPlaceholder"),
                        dropoff: t("offerRide.dropoff"),
                        dropoffPlaceholder: t("offerRide.dropoffPlaceholder"),
                        dateTimeSection: t("offerRide.dateTime"),
                        date: t("offerRide.date"),
                        time: t("offerRide.time"),
                        seatsPriceSection: t("offerRide.seatsPrice"),
                        availableSeats: t("offerRide.availableSeats"),
                        seatsPlaceholder: t("offerRide.seatsPlaceholder"),
                        pricePerSeat: t("offerRide.pricePerSeat"),
                        pricePlaceholder: t("offerRide.pricePlaceholder"),
                        carSection: t("offerRide.carDetails"),
                        myCars: t("offerRide.myCars"),
                        manualCar: t("offerRide.manualCar"),
                        chooseCar: t("offerRide.chooseCar"),
                        carBrand: t("offerRide.carBrand"),
                        carBrandPlaceholder: t("offerRide.carBrandPlaceholder"),
                        carModel: t("offerRide.carModel"),
                        carModelPlaceholder: t("offerRide.carModelPlaceholder"),
                        licensePlate: t("offerRide.licensePlate"),
                        platePlaceholder: t("offerRide.platePlaceholder"),
                        noCars: t("offerRide.noCars"),
                        publishLabel: t("offerRide.publish"),
                    }}
                    pickup={pickup}
                    onPickupChange={(value) => setValue("pickup", value)}
                    dropoff={dropoff}
                    onDropoffChange={(value) => setValue("dropoff", value)}
                    date={date}
                    onDateChange={(value) => setValue("date", value)}
                    dateLocale={datePickerLocale}
                    today={OFFER_RIDE_TODAY}
                    time={time}
                    onTimeChange={(value) => setValue("time", value)}
                    seats={seats}
                    onSeatsChange={(value) => setValue("seats", value)}
                    price={price}
                    onPriceChange={(value) => setValue("price", value)}
                    savedCars={driverCars}
                    carMode={carMode}
                    onCarModeChange={(mode) => setValue("carMode", mode)}
                    selectedCarId={selectedCarId}
                    onSelectedCarChange={(id) => setValue("selectedCarId", id)}
                    manualBrand={manualBrand}
                    onManualBrandChange={(value) =>
                        setValue("manualBrand", value)
                    }
                    manualModel={manualModel}
                    onManualModelChange={(value) =>
                        setValue("manualModel", value)
                    }
                    manualPlate={manualPlate}
                    onManualPlateChange={(value) =>
                        setValue("manualPlate", value)
                    }
                    manualPlateError={formState.errors.manualPlate?.message}
                    publishedMessage={publishedMessage}
                    onPublishClick={handlePublish}
                />
            </div>

            {showSaveCarPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowSaveCarPrompt(false)}
                    />
                    <div className="relative w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-(--color-text-primary)">
                            {t("offerRide.saveCarTitle")}
                        </h2>
                        <p className="mt-2 text-sm text-(--color-text-secondary)">
                            {t("offerRide.saveCarText", {
                                car: `${manualBrand.trim()} ${manualModel.trim()}`.trim(),
                                plate: manualPlate.trim().toUpperCase(),
                            })}
                        </p>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <Button
                                variant="secondary"
                                onClick={publishRide}
                            >
                                {t("offerRide.skipSaveCar")}
                            </Button>
                            <Button onClick={handleSaveManualCar}>
                                {t("offerRide.saveCar")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
