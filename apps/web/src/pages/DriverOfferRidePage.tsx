import { useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cs, enUS, sk as skLocale } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
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
import { PLATE_MAX_LENGTH, PLATE_MIN_LENGTH } from "@repo/shared/validation";
import { carCatalog } from "@repo/shared/car-catalog";

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

const CAR_DATA = carCatalog;

const FALLBACK_CAR_BRANDS = Array.from(
    new Set(CAR_DATA.map((row) => row.brand))
).sort((a, b) => a.localeCompare(b));

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

// Ride-detail fields (pickup, dropoff, date, time, seats, price) are always
// required and validated by this schema via the RHF resolver. The manual-car
// fields are kept unconstrained here because they only apply in "manual" car
// mode — that branch is validated imperatively in onSubmit, where the active
// carMode is known.
const offerRideSchema = z
    .object({
        pickupCity: z
            .custom<CityListItem | null>()
            .refine(
                (value): value is CityListItem => value !== null,
                "offerRide.requiredField"
            ),
        dropoffCity: z
            .custom<CityListItem | null>()
            .refine(
                (value): value is CityListItem => value !== null,
                "offerRide.requiredField"
            ),
        rideDate: z
            .date()
            .optional()
            .refine(
                (value): value is Date => value instanceof Date,
                "offerRide.requiredField"
            ),
        rideTime: z.string().min(1, "offerRide.requiredField"),
        seats: z.string().superRefine((value, ctx) => {
            if (value.trim() === "") {
                ctx.addIssue({
                    code: "custom",
                    message: "offerRide.requiredField",
                });
            } else if (parsePositiveInteger(value) === null) {
                ctx.addIssue({
                    code: "custom",
                    message: "offerRide.invalidSeatsError",
                });
            }
        }),
        price: z.string().superRefine((value, ctx) => {
            if (value.trim() === "") {
                ctx.addIssue({
                    code: "custom",
                    message: "offerRide.requiredField",
                });
            } else if (parsePositiveInteger(value) === null) {
                ctx.addIssue({
                    code: "custom",
                    message: "offerRide.invalidPriceError",
                });
            }
        }),
        manualBrand: z.string(),
        manualModel: z.string(),
        manualPlate: z.string(),
    })
    .refine(
        (values) => {
            // `disablePastDates` on the picker blocks past calendar days; this
            // additionally rejects a today + earlier-time combination, which the
            // API would otherwise reject with a generic 400.
            if (!(values.rideDate instanceof Date) || !values.rideTime) {
                return true;
            }
            const departureAt = combineDateAndTime(
                values.rideDate,
                values.rideTime
            );
            return departureAt !== null && departureAt.getTime() > Date.now();
        },
        { message: "offerRide.pastDeparture", path: ["rideTime"] }
    );

type OfferRideFormInput = z.input<typeof offerRideSchema>;
type OfferRideFormValues = z.output<typeof offerRideSchema>;

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

    const {
        watch,
        setValue,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors, isSubmitted },
    } = useForm<OfferRideFormInput, unknown, OfferRideFormValues>({
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

    // Car selection reacts to the async saved-cars list, so it stays in local
    // state and is synced during render (the prev-key pattern below) rather
    // than through an effect.
    const [localSavedCars, setLocalSavedCars] = useState<OfferRideCar[]>([]);
    const [carMode, setCarMode] = useState<"saved" | "manual">("manual");
    const [selectedCarId, setSelectedCarId] = useState("");
    const [publishedMessage, setPublishedMessage] = useState("");
    const [publishError, setPublishError] = useState("");
    const [hasUserSelectedCarMode, setHasUserSelectedCarMode] = useState(false);
    const [durationHours, setDurationHours] = useState("");
    const [durationMinutes, setDurationMinutes] = useState("");
    const [durationError, setDurationError] = useState("");

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
        clearErrors(["manualBrand", "manualModel", "manualPlate"]);
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

    const datePickerLocale =
        LOCALES[language as keyof typeof LOCALES] ??
        LOCALES[toUiLanguage(language) as keyof typeof LOCALES] ??
        enUS;

    function handleManualBrandChange(value: string) {
        setValue("manualBrand", value, { shouldValidate: isSubmitted });
        setValue("manualModel", "", { shouldValidate: isSubmitted });
        clearErrors(["manualBrand", "manualModel"]);
    }

    function handleManualModelChange(value: string) {
        setValue("manualModel", value, { shouldValidate: isSubmitted });
        clearErrors("manualModel");
    }

    function handleManualPlateChange(value: string) {
        setValue("manualPlate", value, { shouldValidate: isSubmitted });
        clearErrors("manualPlate");
    }

    function handleSeatsChange(value: string) {
        if (isIntegerInput(value)) {
            setValue("seats", value, { shouldValidate: isSubmitted });
        }
    }

    function handlePriceChange(value: string) {
        if (isIntegerInput(value)) {
            setValue("price", value, { shouldValidate: isSubmitted });
        }
    }

    function buildCreateRideBody(carId: string): CreateRideBody | null {
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

        const durationTotalMinutes =
            (Number.parseInt(durationHours, 10) || 0) * 60 +
            (Number.parseInt(durationMinutes, 10) || 0);
        const arrivalEstimateAt =
            durationTotalMinutes > 0
                ? new Date(
                      departureAt.getTime() + durationTotalMinutes * 60_000
                  ).toISOString()
                : null;

        return {
            carId,
            departureAt: departureAt.toISOString(),
            arrivalEstimateAt,
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

    async function publishRide(carId: string) {
        setPublishedMessage("");

        const body = buildCreateRideBody(carId);

        if (!body) {
            setPublishError("offerRide.missingFieldsError");
            return;
        }

        setPublishError("");
        await createRideMutation.mutateAsync({ data: body });
    }

    const onSubmit: SubmitHandler<OfferRideFormValues> = async (values) => {
        setPublishedMessage("");

        const totalDurationMins =
            (Number.parseInt(durationHours, 10) || 0) * 60 +
            (Number.parseInt(durationMinutes, 10) || 0);
        if (totalDurationMins <= 0) {
            setDurationError("offerRide.requiredField");
            return;
        }
        setDurationError("");

        if (carMode === "manual") {
            const brand = values.manualBrand.trim();
            const model = values.manualModel.trim();
            const plate = normalizePlate(values.manualPlate);

            let hasError = false;
            if (!brand) {
                setError("manualBrand", { message: "offerRide.requiredField" });
                hasError = true;
            }
            if (!model) {
                setError("manualModel", { message: "offerRide.requiredField" });
                hasError = true;
            }
            if (!plate) {
                setError("manualPlate", { message: "offerRide.requiredField" });
                hasError = true;
            } else if (
                plate.length < PLATE_MIN_LENGTH ||
                plate.length > PLATE_MAX_LENGTH
            ) {
                setError("manualPlate", { message: "offerRide.plateLength" });
                hasError = true;
            }
            if (hasError) return;

            const alreadySaved = driverCars.find(
                (car) =>
                    car.brand.toLowerCase() === brand.toLowerCase() &&
                    car.model.toLowerCase() === model.toLowerCase() &&
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

        if (!selectedCarId) {
            setPublishError("offerRide.missingFieldsError");
            return;
        }

        try {
            await publishRide(selectedCarId);
        } catch (error) {
            console.error("Publish ride failed", error);
            setPublishError(
                getErrorI18nKey(error, {}, "offerRide.publishError")
            );
        }
    };

    const fieldError = (key?: string) => (key ? t(key) : undefined);

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
                        duration: t("offerRide.duration"),
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
                    onPickupCityChange={(city) =>
                        setValue("pickupCity", city, {
                            shouldValidate: isSubmitted,
                        })
                    }
                    pickupError={fieldError(errors.pickupCity?.message)}
                    dropoffCity={dropoffCity}
                    onDropoffCityChange={(city) =>
                        setValue("dropoffCity", city, {
                            shouldValidate: isSubmitted,
                        })
                    }
                    dropoffError={fieldError(errors.dropoffCity?.message)}
                    date={rideDate}
                    onDateChange={(date) =>
                        setValue("rideDate", date, {
                            shouldValidate: isSubmitted,
                        })
                    }
                    dateLocale={datePickerLocale}
                    today={offerRideToday}
                    dateError={fieldError(errors.rideDate?.message)}
                    time={rideTime}
                    onTimeChange={(time) =>
                        setValue("rideTime", time, {
                            shouldValidate: isSubmitted,
                        })
                    }
                    timeError={fieldError(errors.rideTime?.message)}
                    durationHours={durationHours}
                    onDurationHoursChange={(v) => {
                        setDurationHours(v);
                        setDurationError("");
                    }}
                    durationMinutes={durationMinutes}
                    onDurationMinutesChange={(v) => {
                        setDurationMinutes(v);
                        setDurationError("");
                    }}
                    durationError={durationError ? t(durationError) : undefined}
                    seats={seats}
                    onSeatsChange={handleSeatsChange}
                    seatsError={fieldError(errors.seats?.message)}
                    price={price}
                    onPriceChange={handlePriceChange}
                    priceError={fieldError(errors.price?.message)}
                    savedCars={driverCars}
                    carMode={carMode}
                    onCarModeChange={handleCarModeChange}
                    selectedCarId={selectedCarId}
                    onSelectedCarChange={setSelectedCarId}
                    manualBrand={manualBrand}
                    onManualBrandChange={handleManualBrandChange}
                    manualBrandOptions={carBrandOptions}
                    manualBrandLoading={isLoadingCarBrands}
                    manualBrandError={fieldError(errors.manualBrand?.message)}
                    manualModel={manualModel}
                    onManualModelChange={handleManualModelChange}
                    manualModelOptions={carModelOptions}
                    manualModelLoading={isLoadingCarModels}
                    manualModelDisabled={!manualBrand}
                    manualModelError={fieldError(errors.manualModel?.message)}
                    manualPlate={manualPlate}
                    onManualPlateChange={handleManualPlateChange}
                    manualPlateError={
                        errors.manualPlate?.message
                            ? t(errors.manualPlate.message, {
                                  min: PLATE_MIN_LENGTH,
                                  max: PLATE_MAX_LENGTH,
                              })
                            : undefined
                    }
                    publishedMessage={
                        publishedMessage ? t(publishedMessage) : ""
                    }
                    onPublishClick={() => {
                        const totalMins =
                            (Number.parseInt(durationHours, 10) || 0) * 60 +
                            (Number.parseInt(durationMinutes, 10) || 0);
                        if (totalMins <= 0) {
                            setDurationError("offerRide.requiredField");
                        }
                        handleSubmit(onSubmit)();
                    }}
                />
                {publishError && (
                    <p className="mt-4 w-full rounded-xl border border-(--color-danger-border) bg-(--color-danger-bg) px-4 py-3 text-sm font-semibold text-(--color-danger-text)">
                        {t(publishError)}
                    </p>
                )}
            </div>
        </div>
    );
}
