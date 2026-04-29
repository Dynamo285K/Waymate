import { useMemo, useState } from "react";
import type { ComponentProps, ComponentType } from "react";
import { cs, enUS, sk as skLocale } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { DriverNavbar, Button, OfferRideForm } from "@waymate/ui";
import type { Language, OfferRideCar } from "@waymate/ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { toUiLanguage } from "../lib/language";
import { useNavigate } from "../lib/router-compat";
import {
    getCarsBrandsByBrandModels,
    getCarsMe,
    useGetCarsBrands,
    useGetCarsBrandsByBrandModels,
    useGetCarsMe,
    usePostCarsMe,
    getGetCarsMeQueryKey,
} from "../api-client/cars/cars";
import { usePostRides, getGetRidesMeQueryKey } from "../api-client/rides/rides";
import carData from "../../../api/src/db/cars-data.json";

type Props = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (l: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

const LOCALES = {
    en: enUS,
    sk: skLocale,
    cs,
} as const;

type UserCarRow = {
    id: string;
    brand: string;
    modelName: string;
    spz: string;
};

import type { CreateRideBody } from "../api-client/model/createRideBody";
import type { CreateCarBody as ApiCreateCarBody } from "../api-client/model/createCarBody";

type CreateCarBody = ApiCreateCarBody & {
    countryCode: "SK";
    color: "OTHER";
};

type CreatedCarRow = {
    id: string;
};

type CarDataRow = {
    brand: string;
    modelName: string;
};

const CAR_DATA = carData as CarDataRow[];

const FALLBACK_CAR_BRANDS = Array.from(
    new Set(CAR_DATA.map((row) => row.brand))
).sort((a, b) => a.localeCompare(b));

type OfferRideFormWithCarOptionsProps = ComponentProps<typeof OfferRideForm> & {
    labels?: ComponentProps<typeof OfferRideForm>["labels"] & {
        selectCarBrand?: string;
        selectCarModel?: string;
        loadingCarBrands?: string;
        loadingCarModels?: string;
        plateError?: string;
    };
    manualBrandOptions?: string[];
    manualBrandLoading?: boolean;
    manualModelOptions?: string[];
    manualModelLoading?: boolean;
    manualModelDisabled?: boolean;
    manualPlateError?: string;
};

const OfferRideFormWithCarOptions =
    OfferRideForm as ComponentType<OfferRideFormWithCarOptionsProps>;

function normalizePlate(plate: string) {
    return plate
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        if (error.message === "Failed to fetch") {
            return "Cannot reach the API. Make sure the backend is running on localhost:3000 and open the app through localhost:5173.";
        }

        return error.message;
    }

    if (
        error &&
        typeof error === "object" &&
        "value" in error &&
        error.value &&
        typeof error.value === "object" &&
        "error" in error.value &&
        typeof error.value.error === "string"
    ) {
        return error.value.error;
    }

    if (
        error &&
        typeof error === "object" &&
        "error" in error &&
        typeof error.error === "string"
    ) {
        return error.error;
    }

    return "";
}

function toOfferRideCar(car: UserCarRow): OfferRideCar {
    return {
        id: car.id,
        brand: car.brand,
        model: car.modelName,
        plate: car.spz,
    };
}

function combineDateAndTime(date: Date | undefined, time: string) {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(":").map(Number);
    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

function parsePositiveInteger(value: string) {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }

    return parsed;
}

function isIntegerInput(value: string) {
    return /^\d*$/.test(value);
}

export function DriverOfferRidePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const navbarProps = useDriverNavbarProps({
        activeTab: "offer-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const [localSavedCars, setLocalSavedCars] = useState<OfferRideCar[]>([]);
    const [carMode, setCarMode] = useState<"saved" | "manual">("manual");
    const [selectedCarId, setSelectedCarId] = useState("");
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
    const [publishError, setPublishError] = useState("");
    const [hasUserSelectedCarMode, setHasUserSelectedCarMode] = useState(false);

    const formKey = `${pickup}|${dropoff}|${rideDate?.toISOString() ?? ""}|${rideTime}|${seats}|${price}|${carMode}|${selectedCarId}|${manualBrand}|${manualModel}|${manualPlate}`;
    const [prevFormKey, setPrevFormKey] = useState(formKey);
    if (formKey !== prevFormKey) {
        setPrevFormKey(formKey);
        if (publishError) setPublishError("");
    }

    const userCarsQuery = useGetCarsMe();

    const apiSavedCars = useMemo(
        () => userCarsQuery.data?.map((car) => toOfferRideCar(car)) ?? [],
        [userCarsQuery.data]
    );
    const driverCars = useMemo(
        () => [...apiSavedCars, ...localSavedCars],
        [apiSavedCars, localSavedCars]
    );
    const offerRideToday = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }, []);

    function handleCarModeChange(mode: "saved" | "manual") {
        setHasUserSelectedCarMode(true);
        setCarMode(mode);
    }

    const driverCarsKey = driverCars.map((car) => car.id).join("|");
    const [prevDriverCarsKey, setPrevDriverCarsKey] = useState(driverCarsKey);
    if (driverCarsKey !== prevDriverCarsKey) {
        setPrevDriverCarsKey(driverCarsKey);
        if (driverCars.length === 0) {
            if (carMode === "saved") setCarMode("manual");
            if (selectedCarId) setSelectedCarId("");
        } else if (!driverCars.some((car) => car.id === selectedCarId)) {
            setSelectedCarId(driverCars[0].id);
        }
    }

    const manualEntryKey = `${carMode}|${manualBrand}|${manualModel}|${manualPlate}`;
    const [prevManualEntryKey, setPrevManualEntryKey] =
        useState(manualEntryKey);
    if (manualEntryKey !== prevManualEntryKey) {
        setPrevManualEntryKey(manualEntryKey);
        if (
            !hasUserSelectedCarMode &&
            driverCars.length > 0 &&
            carMode === "manual" &&
            !manualBrand &&
            !manualModel &&
            !manualPlate
        ) {
            setCarMode("saved");
        }
    }

    const brandsQuery = useGetCarsBrands();
    const modelsQuery = useGetCarsBrandsByBrandModels(manualBrand, {
        query: { enabled: Boolean(manualBrand) },
    });

    const createRideMutation = usePostRides({
        mutation: {
            onSuccess: async () => {
                setPublishedMessage(t("offerRide.published"));
                setPublishError("");
                await queryClient.invalidateQueries({
                    queryKey: getGetRidesMeQueryKey(),
                });
                navigate("/driver/rides");
            },
            onError: (error) => {
                const message = getErrorMessage(error);
                setPublishError(
                    message ||
                        t(
                            "offerRide.publishError",
                            "Could not publish this ride. Please check the form and try again."
                        )
                );
            },
        },
    });

    const createCarMutation = usePostCarsMe({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetCarsMeQueryKey(),
                });
            },
        },
    });

    const apiCarBrandOptions =
        brandsQuery.data?.map((row) => row.brand).filter(Boolean) ?? [];
    const fallbackCarModelOptions = CAR_DATA.filter(
        (row) => row.brand === manualBrand
    )
        .map((row) => row.modelName)
        .sort((a, b) => a.localeCompare(b));
    const apiCarModelOptions =
        modelsQuery.data?.map((row) => row.modelName).filter(Boolean) ?? [];
    const carBrandOptions =
        apiCarBrandOptions.length > 0
            ? apiCarBrandOptions
            : FALLBACK_CAR_BRANDS;
    const carModelOptions =
        apiCarModelOptions.length > 0
            ? apiCarModelOptions
            : fallbackCarModelOptions;
    const isLoadingCarBrands =
        brandsQuery.isLoading && apiCarBrandOptions.length === 0;
    const isLoadingCarModels =
        modelsQuery.isLoading &&
        apiCarModelOptions.length === 0 &&
        fallbackCarModelOptions.length === 0;
    const manualPlateError = undefined;

    const datePickerLocale =
        LOCALES[language as keyof typeof LOCALES] ??
        LOCALES[toUiLanguage(language) as keyof typeof LOCALES] ??
        enUS;

    function handleManualBrandChange(value: string) {
        setManualBrand(value);
        setManualModel("");
    }

    function handleSeatsChange(value: string) {
        if (isIntegerInput(value)) {
            setSeats(value);
        }
    }

    function handlePriceChange(value: string) {
        if (isIntegerInput(value)) {
            setPrice(value);
        }
    }

    function getRideFormValidationError(carId = selectedCarId) {
        const departureAt = combineDateAndTime(rideDate, rideTime);
        const offeredSeats = parsePositiveInteger(seats);
        const priceAmount = parsePositiveInteger(price);
        const pickupCity = pickup.trim();
        const dropoffCity = dropoff.trim();

        if (!pickupCity || !dropoffCity || !departureAt || !carId) {
            return t(
                "offerRide.missingFieldsError",
                "Please fill pickup, dropoff, date, time, seats, price, and choose a saved car."
            );
        }

        if (!offeredSeats) {
            return t(
                "offerRide.invalidSeatsError",
                "Available seats must be a whole number greater than 0."
            );
        }

        if (!priceAmount) {
            return t(
                "offerRide.invalidPriceError",
                "Price per seat must be a whole number greater than 0."
            );
        }

        return "";
    }

    function buildCreateRideBody(carId = selectedCarId): CreateRideBody | null {
        const departureAt = combineDateAndTime(rideDate, rideTime);
        const offeredSeats = parsePositiveInteger(seats);
        const priceAmount = parsePositiveInteger(price);
        const pickupCity = pickup.trim();
        const dropoffCity = dropoff.trim();

        if (
            !carId ||
            !departureAt ||
            !pickupCity ||
            !dropoffCity ||
            !offeredSeats ||
            !priceAmount
        ) {
            return null;
        }

        return {
            carId,
            departureAt: departureAt.toISOString(),
            arrivalEstimateAt: null,
            offeredSeats,
            currency: "EUR",
            description: null,
            stops: [
                {
                    address: pickupCity,
                    city: pickupCity,
                    countryCode: "SK",
                    lat: 0,
                    lng: 0,
                    plannedArrivalAt: null,
                    plannedDepartureAt: departureAt.toISOString(),
                },
                {
                    address: dropoffCity,
                    city: dropoffCity,
                    countryCode: "SK",
                    lat: 0,
                    lng: 0,
                    plannedArrivalAt: null,
                    plannedDepartureAt: null,
                },
            ],
            prices: [
                {
                    startStopOrder: 0,
                    endStopOrder: 1,
                    amount: priceAmount,
                    currency: "EUR",
                },
            ],
        };
    }

    async function getManualModelId() {
        const brand = manualBrand.trim();
        const model = manualModel.trim();
        const cachedModel = modelsQuery.data?.find(
            (row) => row.brand === brand && row.modelName === model
        );

        if (cachedModel) {
            return cachedModel.id;
        }

        const models = await getCarsBrandsByBrandModels(brand);

        return models.find((row) => row.modelName === model)?.id ?? null;
    }

    async function createManualCarForRide() {
        const modelId = await getManualModelId();
        const offeredSeats = parsePositiveInteger(seats);

        if (!modelId || !offeredSeats) {
            return null;
        }

        const normalizedPlate = normalizePlate(manualPlate);
        const createCarBody: CreateCarBody = {
            modelId,
            spz: normalizedPlate,
            countryCode: "SK",
            color: "OTHER",
            seatsTotal: Math.min(Math.max(offeredSeats + 1, 2), 9),
        };

        let createdCar: CreatedCarRow;

        try {
            createdCar = await createCarMutation.mutateAsync({
                data: createCarBody,
            });
        } catch (error) {
            const freshCars = await queryClient.fetchQuery({
                queryKey: getGetCarsMeQueryKey(),
                queryFn: () => getCarsMe(),
            });
            const existingCar = freshCars.find(
                (car) => normalizePlate(car.spz) === normalizedPlate
            );

            if (existingCar) {
                setSelectedCarId(existingCar.id);
                setCarMode("saved");
                return existingCar.id;
            }

            throw error;
        }

        const savedCar: OfferRideCar = {
            id: createdCar.id,
            brand: manualBrand.trim(),
            model: manualModel.trim(),
            plate: normalizedPlate,
        };

        setLocalSavedCars((cars) => [...cars, savedCar]);
        setSelectedCarId(createdCar.id);
        setCarMode("saved");

        return createdCar.id;
    }

    async function publishRide(carId = selectedCarId) {
        setShowSaveCarPrompt(false);
        setPublishedMessage("");

        const body = buildCreateRideBody(carId);

        if (!body) {
            setPublishError(getRideFormValidationError(carId));
            return;
        }

        setPublishError("");
        await createRideMutation.mutateAsync({ data: body });
    }

    async function handlePublish() {
        setPublishedMessage("");
        setPublishError("");

        if (
            carMode === "manual" &&
            manualBrand.trim() &&
            manualModel.trim() &&
            manualPlate.trim()
        ) {
            const plate = normalizePlate(manualPlate);
            const alreadySaved = driverCars.find(
                (car) =>
                    car.brand.toLowerCase() ===
                        manualBrand.trim().toLowerCase() &&
                    car.model.toLowerCase() ===
                        manualModel.trim().toLowerCase() &&
                    normalizePlate(car.plate) === plate
            );

            try {
                const carId =
                    alreadySaved?.id ?? (await createManualCarForRide());

                if (!carId) {
                    setPublishError(
                        t(
                            "offerRide.carCreateError",
                            "Could not save this car. Please check the car details."
                        )
                    );
                    return;
                }

                await publishRide(carId);
            } catch (error) {
                const message = getErrorMessage(error);
                setPublishError(
                    message ||
                        t(
                            "offerRide.publishError",
                            "Could not publish this ride. Please check the form and try again."
                        )
                );
            }

            return;
        }

        if (carMode === "manual") {
            setPublishError(
                t(
                    "offerRide.missingFieldsError",
                    "Please fill pickup, dropoff, date, time, seats, price, and choose a saved car."
                )
            );
            return;
        }

        try {
            await publishRide();
        } catch (error) {
            const message = getErrorMessage(error);
            setPublishError(
                message ||
                    t(
                        "offerRide.publishError",
                        "Could not publish this ride. Please check the form and try again."
                    )
            );
        }
    }

    async function handleSaveManualCar() {
        try {
            const carId = await createManualCarForRide();

            if (!carId) {
                setPublishError(
                    t(
                        "offerRide.carCreateError",
                        "Could not save this car. Please check the car details."
                    )
                );
                return;
            }

            await publishRide(carId);
        } catch (error) {
            const message = getErrorMessage(error);
            setPublishError(
                message ||
                    t(
                        "offerRide.publishError",
                        "Could not publish this ride. Please check the form and try again."
                    )
            );
        }
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <OfferRideFormWithCarOptions
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
                        selectCarBrand: t(
                            "offerRide.selectCarBrand",
                            "Select brand"
                        ),
                        selectCarModel: t(
                            "offerRide.selectCarModel",
                            "Select model"
                        ),
                        loadingCarBrands: t(
                            "offerRide.loadingCarBrands",
                            "Loading brands..."
                        ),
                        loadingCarModels: t(
                            "offerRide.loadingCarModels",
                            "Loading models..."
                        ),
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
                    today={offerRideToday}
                    time={rideTime}
                    onTimeChange={setRideTime}
                    seats={seats}
                    onSeatsChange={handleSeatsChange}
                    price={price}
                    onPriceChange={handlePriceChange}
                    savedCars={driverCars}
                    carMode={carMode}
                    onCarModeChange={handleCarModeChange}
                    selectedCarId={selectedCarId}
                    onSelectedCarChange={setSelectedCarId}
                    manualBrand={manualBrand}
                    onManualBrandChange={handleManualBrandChange}
                    manualBrandOptions={carBrandOptions}
                    manualBrandLoading={isLoadingCarBrands}
                    manualModel={manualModel}
                    onManualModelChange={setManualModel}
                    manualModelOptions={carModelOptions}
                    manualModelLoading={isLoadingCarModels}
                    manualModelDisabled={!manualBrand}
                    manualPlate={manualPlate}
                    onManualPlateChange={setManualPlate}
                    manualPlateError={manualPlateError}
                    publishedMessage={publishedMessage}
                    onPublishClick={handlePublish}
                />
                {publishError && (
                    <p className="mt-4 w-full rounded-xl border border-(--color-danger-border) bg-(--color-danger-bg) px-4 py-3 text-sm font-semibold text-(--color-danger-text)">
                        {publishError}
                    </p>
                )}
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
                                onClick={() => void publishRide()}
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
