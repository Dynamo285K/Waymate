import { useEffect, useMemo, useRef, useState } from "react";
import { cs, enUS, sk as skLocale } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { DriverNavbar, Button, DatePicker } from "waymate-ui";
import type { Language } from "waymate-ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";

type Props = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (l: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type DriverCar = {
    id: string;
    brand: string;
    model: string;
    plate: string;
};

const INITIAL_DRIVER_CARS: DriverCar[] = [
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

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
    const hours = Math.floor(index / 2);
    const minutes = index % 2 === 0 ? "00" : "30";
    return `${String(hours).padStart(2, "0")}:${minutes}`;
});

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
        useState<DriverCar[]>(INITIAL_DRIVER_CARS);
    const [carMode, setCarMode] = useState<"saved" | "manual">(
        INITIAL_DRIVER_CARS.length > 0 ? "saved" : "manual"
    );
    const [selectedCarId, setSelectedCarId] = useState(
        INITIAL_DRIVER_CARS[0]?.id ?? ""
    );
    const [manualBrand, setManualBrand] = useState("");
    const [manualModel, setManualModel] = useState("");
    const [manualPlate, setManualPlate] = useState("");
    const [rideDate, setRideDate] = useState<Date | undefined>();
    const [rideTime, setRideTime] = useState("");
    const [timePickerOpen, setTimePickerOpen] = useState(false);
    const [showSaveCarPrompt, setShowSaveCarPrompt] = useState(false);
    const [publishedMessage, setPublishedMessage] = useState("");
    const timePickerRef = useRef<HTMLLabelElement>(null);

    const selectedCar = useMemo(
        () => driverCars.find((car) => car.id === selectedCarId),
        [driverCars, selectedCarId]
    );

    const inputClass =
        "w-full rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) px-4 py-3 text-sm outline-none focus:border-(--color-primary) transition-colors";
    const labelClass =
        "mb-2 flex items-center gap-2 text-sm font-semibold text-(--color-text-primary)";
    const sectionClass =
        "rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-lg";
    const datePickerLocale = LOCALES[language as keyof typeof LOCALES] ?? enUS;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                timePickerRef.current &&
                !timePickerRef.current.contains(event.target as Node)
            ) {
                setTimePickerOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            const manualPlateValue = manualPlate.trim().toUpperCase();
            const alreadySaved = driverCars.some(
                (car) =>
                    car.brand.toLowerCase() ===
                        manualBrand.trim().toLowerCase() &&
                    car.model.toLowerCase() ===
                        manualModel.trim().toLowerCase() &&
                    car.plate.toUpperCase() === manualPlateValue
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
            const newCar = {
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
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-(--color-text-primary)">
                        {t("offerRide.title")}
                    </h1>
                    <p className="mt-2 text-sm text-(--color-text-secondary)">
                        {t("offerRide.subtitle")}
                    </p>
                </div>

                <div className="flex flex-col gap-6">
                    <section className={sectionClass}>
                        <h2 className="mb-5 text-xl font-bold text-(--color-text-primary)">
                            {t("offerRide.route")}
                        </h2>
                        <div className="flex flex-col gap-4">
                            <label>
                                <span className={labelClass}>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                        />
                                    </svg>
                                    {t("offerRide.pickup")}
                                </span>
                                <input
                                    className={inputClass}
                                    placeholder={t(
                                        "offerRide.pickupPlaceholder"
                                    )}
                                />
                            </label>
                            <label>
                                <span className={labelClass}>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                                        <circle
                                            cx="12"
                                            cy="10"
                                            r="3"
                                        />
                                    </svg>
                                    {t("offerRide.dropoff")}
                                </span>
                                <input
                                    className={inputClass}
                                    placeholder={t(
                                        "offerRide.dropoffPlaceholder"
                                    )}
                                />
                            </label>
                        </div>
                    </section>

                    <section className={sectionClass}>
                        <h2 className="mb-5 text-xl font-bold text-(--color-text-primary)">
                            {t("offerRide.dateTime")}
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label>
                                <span className={labelClass}>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                        />
                                        <path d="M16 2v4" />
                                        <path d="M8 2v4" />
                                        <path d="M3 10h18" />
                                    </svg>
                                    {t("offerRide.date")}
                                </span>
                                <DatePicker
                                    value={rideDate}
                                    onChange={setRideDate}
                                    placeholder={t("home.search.date")}
                                    locale={datePickerLocale}
                                    today={OFFER_RIDE_TODAY}
                                    disablePastDates
                                />
                            </label>
                            <label ref={timePickerRef}>
                                <span className={labelClass}>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                        />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                    {t("offerRide.time")}
                                </span>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTimePickerOpen((open) => !open)
                                        }
                                        className={`${inputClass} flex items-center justify-between text-left ${
                                            rideTime
                                                ? ""
                                                : "text-(--color-text-secondary)"
                                        }`}
                                    >
                                        <span>{rideTime || "--:--"}</span>
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                            className="text-(--color-text-secondary)"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="10"
                                            />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                    </button>
                                    {timePickerOpen && (
                                        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 max-h-64 w-full overflow-y-auto rounded-xl border border-(--color-border) bg-(--color-card) p-1 shadow-xl">
                                            {TIME_OPTIONS.map((time) => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => {
                                                        setRideTime(time);
                                                        setTimePickerOpen(
                                                            false
                                                        );
                                                    }}
                                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                                                        rideTime === time
                                                            ? "bg-green-50 text-(--color-primary)"
                                                            : "text-(--color-text-primary) hover:bg-(--color-bg)"
                                                    }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </section>

                    <section className={sectionClass}>
                        <h2 className="mb-5 text-xl font-bold text-(--color-text-primary)">
                            {t("offerRide.seatsPrice")}
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label>
                                <span className={labelClass}>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle
                                            cx="9"
                                            cy="7"
                                            r="4"
                                        />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    {t("offerRide.availableSeats")}
                                </span>
                                <input
                                    className={inputClass}
                                    placeholder={t(
                                        "offerRide.seatsPlaceholder"
                                    )}
                                />
                            </label>
                            <label>
                                <span className={labelClass}>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            cx="8"
                                            cy="8"
                                            r="5"
                                        />
                                        <circle
                                            cx="16"
                                            cy="16"
                                            r="5"
                                        />
                                        <path d="M8 5v6" />
                                        <path d="M5 8h6" />
                                        <path d="M16 13v6" />
                                        <path d="M13 16h6" />
                                    </svg>
                                    {t("offerRide.pricePerSeat")}
                                </span>
                                <input
                                    className={inputClass}
                                    placeholder={t(
                                        "offerRide.pricePlaceholder"
                                    )}
                                />
                            </label>
                        </div>
                    </section>

                    <section className={sectionClass}>
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xl font-bold text-(--color-text-primary)">
                                {t("offerRide.carDetails")}
                            </h2>
                            {driverCars.length > 0 && (
                                <div className="flex rounded-xl border border-(--color-border) bg-(--color-bg) p-1">
                                    <button
                                        type="button"
                                        onClick={() => setCarMode("saved")}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                                            carMode === "saved"
                                                ? "bg-(--color-card) text-(--color-text-primary) shadow-sm"
                                                : "text-(--color-text-secondary)"
                                        }`}
                                    >
                                        {t("offerRide.myCars")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCarMode("manual")}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                                            carMode === "manual"
                                                ? "bg-(--color-card) text-(--color-text-primary) shadow-sm"
                                                : "text-(--color-text-secondary)"
                                        }`}
                                    >
                                        {t("offerRide.manualCar")}
                                    </button>
                                </div>
                            )}
                        </div>

                        {driverCars.length > 0 && carMode === "saved" ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label className="sm:col-span-2">
                                    <span className={labelClass}>
                                        {t("offerRide.chooseCar")}
                                    </span>
                                    <select
                                        className={
                                            inputClass + " cursor-pointer"
                                        }
                                        value={selectedCarId}
                                        onChange={(event) =>
                                            setSelectedCarId(event.target.value)
                                        }
                                    >
                                        {driverCars.map((car) => (
                                            <option
                                                key={car.id}
                                                value={car.id}
                                            >
                                                {car.brand} {car.model} -{" "}
                                                {car.plate}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <div className="rounded-xl border border-(--color-border) bg-(--color-bg) px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-(--color-text-secondary)">
                                        {t("offerRide.carBrand")}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-(--color-text-primary)">
                                        {selectedCar?.brand}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-(--color-border) bg-(--color-bg) px-4 py-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-(--color-text-secondary)">
                                        {t("offerRide.carModel")}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-(--color-text-primary)">
                                        {selectedCar?.model}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-(--color-border) bg-(--color-bg) px-4 py-3 sm:col-span-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-(--color-text-secondary)">
                                        {t("offerRide.licensePlate")}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-(--color-text-primary)">
                                        {selectedCar?.plate}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {driverCars.length === 0 && (
                                    <p className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                        {t("offerRide.noCars")}
                                    </p>
                                )}
                                <label>
                                    <span className={labelClass}>
                                        {t("offerRide.carBrand")}
                                    </span>
                                    <input
                                        className={inputClass}
                                        value={manualBrand}
                                        onChange={(event) =>
                                            setManualBrand(event.target.value)
                                        }
                                        placeholder={t(
                                            "offerRide.carBrandPlaceholder"
                                        )}
                                    />
                                </label>
                                <label>
                                    <span className={labelClass}>
                                        {t("offerRide.carModel")}
                                    </span>
                                    <input
                                        className={inputClass}
                                        value={manualModel}
                                        onChange={(event) =>
                                            setManualModel(event.target.value)
                                        }
                                        placeholder={t(
                                            "offerRide.carModelPlaceholder"
                                        )}
                                    />
                                </label>
                                <label className="sm:col-span-2">
                                    <span className={labelClass}>
                                        {t("offerRide.licensePlate")}
                                    </span>
                                    <input
                                        className={inputClass}
                                        value={manualPlate}
                                        onChange={(event) =>
                                            setManualPlate(
                                                event.target.value.toUpperCase()
                                            )
                                        }
                                        placeholder={t(
                                            "offerRide.platePlaceholder"
                                        )}
                                    />
                                </label>
                            </div>
                        )}
                    </section>

                    {publishedMessage && (
                        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                            {publishedMessage}
                        </p>
                    )}

                    <Button
                        fullWidth
                        onClick={handlePublish}
                    >
                        {t("offerRide.publish")}
                    </Button>
                </div>
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
