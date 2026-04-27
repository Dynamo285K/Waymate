import { useState } from "react";
import { cs, enUS, sk as skLocale } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { DriverNavbar, Button, OfferRideForm } from "@waymate/ui";
import type { Language, OfferRideCar } from "@waymate/ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";

type Props = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (l: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
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
    cz: cs,
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
    const [carMode, setCarMode] = useState<"saved" | "manual">(
        INITIAL_DRIVER_CARS.length > 0 ? "saved" : "manual"
    );
    const [selectedCarId, setSelectedCarId] = useState(
        INITIAL_DRIVER_CARS[0]?.id ?? ""
    );
    const [manualBrand, setManualBrand] = useState("");
    const [manualModel, setManualModel] = useState("");
    const [manualPlate, setManualPlate] = useState("");
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [rideDate, setRideDate] = useState<Date | undefined>();
    const [rideTime, setRideTime] = useState("");
    const [seats, setSeats] = useState("");
    const [price, setPrice] = useState("");
    const [showSaveCarPrompt, setShowSaveCarPrompt] = useState(false);
    const [publishedMessage, setPublishedMessage] = useState("");

    const datePickerLocale = LOCALES[language as keyof typeof LOCALES] ?? enUS;

    function publishRide() {
        setShowSaveCarPrompt(false);
        setPublishedMessage(t("offerRide.published"));
    }

    function handlePublish() {
        setPublishedMessage("");

        if (
            carMode === "manual" &&
            manualBrand.trim() &&
            manualModel.trim() &&
            manualPlate.trim()
        ) {
            const plate = manualPlate.trim().toUpperCase();
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
            setSelectedCarId(newCar.id);
            setCarMode("saved");
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
                    onPickupChange={setPickup}
                    dropoff={dropoff}
                    onDropoffChange={setDropoff}
                    date={rideDate}
                    onDateChange={setRideDate}
                    dateLocale={datePickerLocale}
                    today={OFFER_RIDE_TODAY}
                    time={rideTime}
                    onTimeChange={setRideTime}
                    seats={seats}
                    onSeatsChange={setSeats}
                    price={price}
                    onPriceChange={setPrice}
                    savedCars={driverCars}
                    carMode={carMode}
                    onCarModeChange={setCarMode}
                    selectedCarId={selectedCarId}
                    onSelectedCarChange={setSelectedCarId}
                    manualBrand={manualBrand}
                    onManualBrandChange={setManualBrand}
                    manualModel={manualModel}
                    onManualModelChange={setManualModel}
                    manualPlate={manualPlate}
                    onManualPlateChange={setManualPlate}
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
