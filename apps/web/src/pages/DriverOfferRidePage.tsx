import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ComponentProps, ComponentType } from "react";
import { cs, enUS, sk as skLocale } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Modal } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../components/navigation/DriverNavbar";
import { OfferRideForm } from "../components/OfferRideForm";
import type { OfferRideCar } from "../components/OfferRideForm";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { getErrorI18nKey } from "../lib/api-errors";
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
import type { CityListItem } from "../components/CitySelect";

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

// The straightforward ride-detail + manual-car inputs are managed by
// react-hook-form. Car selection (carMode/selectedCarId) and UI flags stay as
// useState because they react to the async saved-cars list and don't map onto
// RHF's model. OfferRideForm is fully controlled, so values are read via
// watch() and changes pushed back through setValue().
type OfferRideFormValues = {
    pickupCity: CityListItem | null;
    dropoffCity: CityListItem | null;
    rideDate: Date | undefined;
    rideTime: string;
    seats: string;
    price: string;
    manualBrand: string;
    manualModel: string;
    manualPlate: string;
};

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

    const { watch, setValue } = useForm<OfferRideFormValues>({
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

    const {
        pickupCity,
        dropoffCity,
        rideDate,
        rideTime,
        seats,
        price,
        manualBrand,
        manualModel,
        manualPlate,
    } = watch();

    const [localSavedCars, setLocalSavedCars] = useState<OfferRideCar[]>([]);
    const [carMode, setCarMode] = useState<"saved" | "manual">("manual");
    const [selectedCarId, setSelectedCarId] = useState("");
    const [showSaveCarPrompt, setShowSaveCarPrompt] = useState(false);
    const [publishedMessage, setPublishedMessage] = useState("");
    const [publishError, setPublishError] = useState("");
    const [hasUserSelectedCarMode, setHasUserSelectedCarMode] = useState(false);

    const formKey = `${pickupCity?.id ?? ""}|${dropoffCity?.id ?? ""}|${rideDate?.toISOString() ?? ""}|${rideTime}|${seats}|${price}|${carMode}|${selectedCarId}|${manualBrand}|${manualModel}|${manualPlate}`;
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
                setPublishedMessage("offerRide.published");
                setPublishError("");
                await queryClient.invalidateQueries({
                    queryKey: getGetRidesMeQueryKey(),
                });
                navigate("/driver/rides");
            },
            onError: (error) => {
                console.error("Publish ride failed", error);
                setPublishError(
                    getErrorI18nKey(error, {}, "offerRide.publishError")
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
        setValue("manualBrand", value);
        setValue("manualModel", "");
    }

    function handleSeatsChange(value: string) {
        if (isIntegerInput(value)) {
            setValue("seats", value);
        }
    }

    function handlePriceChange(value: string) {
        if (isIntegerInput(value)) {
            setValue("price", value);
        }
    }

    function getRideFormValidationError(carId = selectedCarId) {
        const departureAt = combineDateAndTime(rideDate, rideTime);
        const offeredSeats = parsePositiveInteger(seats);
        const priceAmount = parsePositiveInteger(price);

        if (!pickupCity || !dropoffCity || !departureAt || !carId) {
            return "offerRide.missingFieldsError";
        }

        if (!offeredSeats) {
            return "offerRide.invalidSeatsError";
        }

        if (!priceAmount) {
            return "offerRide.invalidPriceError";
        }

        return "";
    }

    function buildCreateRideBody(carId = selectedCarId): CreateRideBody | null {
        const departureAt = combineDateAndTime(rideDate, rideTime);
        const offeredSeats = parsePositiveInteger(seats);
        const priceAmount = parsePositiveInteger(price);

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
                    cityId: pickupCity.id,
                    address: pickupCity.name,
                    lat: pickupCity.lat,
                    lng: pickupCity.lng,
                    plannedArrivalAt: null,
                    plannedDepartureAt: departureAt.toISOString(),
                },
                {
                    cityId: dropoffCity.id,
                    address: dropoffCity.name,
                    lat: dropoffCity.lat,
                    lng: dropoffCity.lng,
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
                    setPublishError("offerRide.carCreateError");
                    return;
                }

                await publishRide(carId);
            } catch (error) {
                console.error("Publish ride failed", error);
                setPublishError(
                    getErrorI18nKey(error, {}, "offerRide.publishError")
                );
            }

            return;
        }

        if (carMode === "manual") {
            setPublishError("offerRide.missingFieldsError");
            return;
        }

        try {
            await publishRide();
        } catch (error) {
            console.error("Publish ride failed", error);
            setPublishError(
                getErrorI18nKey(error, {}, "offerRide.publishError")
            );
        }
    }

    async function handleSaveManualCar() {
        try {
            const carId = await createManualCarForRide();

            if (!carId) {
                setPublishError("offerRide.carCreateError");
                return;
            }

            await publishRide(carId);
        } catch (error) {
            console.error("Publish ride failed", error);
            setPublishError(
                getErrorI18nKey(error, {}, "offerRide.publishError")
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
                        selectCarBrand: t("offerRide.selectCarBrand"),
                        selectCarModel: t("offerRide.selectCarModel"),
                        loadingCarBrands: t("offerRide.loadingCarBrands"),
                        loadingCarModels: t("offerRide.loadingCarModels"),
                        licensePlate: t("offerRide.licensePlate"),
                        platePlaceholder: t("offerRide.platePlaceholder"),
                        noCars: t("offerRide.noCars"),
                        publishLabel: t("offerRide.publish"),
                    }}
                    pickupCity={pickupCity}
                    onPickupCityChange={(city) => setValue("pickupCity", city)}
                    dropoffCity={dropoffCity}
                    onDropoffCityChange={(city) =>
                        setValue("dropoffCity", city)
                    }
                    date={rideDate}
                    onDateChange={(date) => setValue("rideDate", date)}
                    dateLocale={datePickerLocale}
                    today={offerRideToday}
                    time={rideTime}
                    onTimeChange={(time) => setValue("rideTime", time)}
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
                    onManualModelChange={(value) =>
                        setValue("manualModel", value)
                    }
                    manualModelOptions={carModelOptions}
                    manualModelLoading={isLoadingCarModels}
                    manualModelDisabled={!manualBrand}
                    manualPlate={manualPlate}
                    onManualPlateChange={(value) =>
                        setValue("manualPlate", value)
                    }
                    manualPlateError={manualPlateError}
                    publishedMessage={
                        publishedMessage ? t(publishedMessage) : ""
                    }
                    onPublishClick={handlePublish}
                />
                {publishError && (
                    <p className="mt-4 w-full rounded-xl border border-(--color-danger-border) bg-(--color-danger-bg) px-4 py-3 text-sm font-semibold text-(--color-danger-text)">
                        {t(publishError)}
                    </p>
                )}
            </div>

            <Modal
                open={showSaveCarPrompt}
                onClose={() => setShowSaveCarPrompt(false)}
            >
                <div className="w-[calc(100vw-2rem)] max-w-md p-6">
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
            </Modal>
        </div>
    );
}
