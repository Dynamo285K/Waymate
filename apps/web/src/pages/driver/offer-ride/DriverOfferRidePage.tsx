import { useMemo, useState } from "react";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cs, enUS, sk as skLocale } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../../../components/navigation/DriverNavbar";
import { OfferRideForm } from "./components/OfferRideForm";
import type { OfferRideCar } from "./components/OfferRideForm";
import {
    offerRideSchema,
    type OfferRideFormInput,
    type OfferRideFormValues,
} from "./components/schema";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { useDriverCars } from "./hooks/useDriverCars";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { toUiLanguage } from "../../../lib/language";
import { useNavigate } from "../../../lib/router-compat";
import {
    buildCreateRideBody,
    normalizePlate,
    parseDurationMinutes,
    parsePositiveInteger,
} from "./lib/offer-ride";
import {
    getCarsBrandsByBrandModels,
    getCarsMe,
    useGetCarsBrands,
    useGetCarsBrandsByBrandModels,
    usePostCarsMe,
    getGetCarsMeQueryKey,
} from "../../../api-client/cars/cars";
import { usePostRides, getGetRidesMeQueryKey } from "../../../api-client/rides/rides";
import type { CreateCarBody as ApiCreateCarBody } from "../../../api-client/model/createCarBody";
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

// The manual-car form only ever creates Slovak cars; colour is left unset.
type CreateCarBody = ApiCreateCarBody & {
    countryCode: "SK";
    color: "OTHER";
};

type CreatedCarRow = {
    id: string;
};

const FALLBACK_CAR_BRANDS = Array.from(
    new Set(carCatalog.map((row) => row.brand))
).sort((a, b) => a.localeCompare(b));

export function DriverOfferRidePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: Props) {
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

    const methods = useForm<OfferRideFormInput, unknown, OfferRideFormValues>({
        resolver: zodResolver(offerRideSchema),
        defaultValues: {
            pickupCity: null,
            dropoffCity: null,
            rideDate: undefined,
            rideTime: "",
            seats: "",
            price: "",
            durationHours: "",
            durationMinutes: "",
            manualBrand: "",
            manualModel: "",
            manualPlate: "",
        },
    });
    const { watch, handleSubmit, setError, clearErrors } = methods;

    const {
        pickupCity,
        dropoffCity,
        rideDate,
        rideTime,
        seats,
        price,
        durationHours,
        durationMinutes,
        manualBrand,
        manualModel,
        manualPlate,
    } = watch();

    // Car picker state (saved cars, mode, selection) and its render-time
    // syncs live in the hook.
    const {
        driverCars,
        carMode,
        setCarMode,
        selectCarMode,
        selectedCarId,
        setSelectedCarId,
        addLocalCar,
    } = useDriverCars({ manualBrand, manualModel, manualPlate });

    // Submission/server state — not form fields, so they stay in useState.
    const [publishedMessage, setPublishedMessage] = useState("");
    const [publishError, setPublishError] = useState("");

    // Clear a stale publish error as soon as any field of the form changes.
    const formKey = `${pickupCity?.id ?? ""}|${dropoffCity?.id ?? ""}|${rideDate?.toISOString() ?? ""}|${rideTime}|${seats}|${price}|${durationHours}|${durationMinutes}|${carMode}|${selectedCarId}|${manualBrand}|${manualModel}|${manualPlate}`;
    const [prevFormKey, setPrevFormKey] = useState(formKey);
    if (formKey !== prevFormKey) {
        setPrevFormKey(formKey);
        if (publishError) setPublishError("");
    }

    const offerRideToday = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }, []);

    function handleCarModeChange(mode: "saved" | "manual") {
        selectCarMode(mode);
        clearErrors(["manualBrand", "manualModel", "manualPlate"]);
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
    const fallbackCarModelOptions = carCatalog
        .filter((row) => row.brand === manualBrand)
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

        addLocalCar(savedCar);
        setSelectedCarId(createdCar.id);
        setCarMode("saved");

        return createdCar.id;
    }

    async function publishRide(carId: string) {
        setPublishedMessage("");

        const body = buildCreateRideBody({
            carId,
            rideDate,
            rideTime,
            seats,
            price,
            pickupCity,
            dropoffCity,
            durationMinutes: parseDurationMinutes(
                durationHours,
                durationMinutes
            ),
        });

        if (!body) {
            setPublishError("offerRide.missingFieldsError");
            return;
        }

        setPublishError("");
        await createRideMutation.mutateAsync({ data: body });
    }

    const onSubmit: SubmitHandler<OfferRideFormValues> = async (values) => {
        // Duration is validated by the schema resolver — reaching here means
        // it is already > 0.
        setPublishedMessage("");

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

    const { t } = useTranslation();

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <FormProvider {...methods}>
                    <OfferRideForm
                        dateLocale={datePickerLocale}
                        today={offerRideToday}
                        car={{
                            savedCars: driverCars,
                            carMode,
                            onCarModeChange: handleCarModeChange,
                            selectedCarId,
                            onSelectedCarChange: setSelectedCarId,
                            brandOptions: carBrandOptions,
                            brandLoading: isLoadingCarBrands,
                            modelOptions: carModelOptions,
                            modelLoading: isLoadingCarModels,
                        }}
                        publishedMessage={
                            publishedMessage ? t(publishedMessage) : ""
                        }
                        onPublishClick={handleSubmit(onSubmit)}
                    />
                </FormProvider>
                {publishError && (
                    <p className="mt-4 w-full rounded-xl border border-(--color-danger-border) bg-(--color-danger-bg) px-4 py-3 text-sm font-semibold text-(--color-danger-text)">
                        {t(publishError)}
                    </p>
                )}
            </div>
        </div>
    );
}
