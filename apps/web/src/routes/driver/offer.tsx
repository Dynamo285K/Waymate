import { useMemo, useState } from "react";
import {
    FormProvider,
    useForm,
    useWatch,
    type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cs, enUS, sk as skLocale } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DriverNavbar } from "../../components/navigation/DriverNavbar";
import { OfferRideForm } from "./-offer/components/OfferRideForm";
import type { OfferRideCar } from "./-offer/components/OfferRideForm";
import {
    offerRideSchema,
    type OfferRideFormInput,
    type OfferRideFormValues,
} from "./-offer/components/schema";
import { useDriverNavbarProps } from "../../features/driver/hooks/useDriverNavbarProps";
import { useDriverCars } from "./-offer/hooks/useDriverCars";
import { useEtaPreview } from "./-offer/hooks/useEtaPreview";
import { getErrorI18nKey } from "../../lib/api-errors";
import { toUiLanguage } from "../../lib/language";
import {
    buildCreateRideBody,
    normalizePlate,
    parsePositiveInteger,
} from "./-offer/lib/offer-ride";
import {
    getCarsBrandsByBrandModels,
    getCarsMe,
    deleteCarsById,
    useGetCarsBrands,
    useGetCarsBrandsByBrandModels,
    usePostCarsMe,
    getGetCarsMeQueryKey,
} from "../../api-client/cars/cars";
import {
    usePostRides,
    getGetRidesMeQueryKey,
} from "../../api-client/rides/rides";
import type { CreateCarBody as ApiCreateCarBody } from "../../api-client/model/createCarBody";
import { PLATE_MAX_LENGTH, PLATE_MIN_LENGTH } from "@repo/shared/validation";
import { carCatalog } from "@repo/shared/car-catalog";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/driver/offer")({
    beforeLoad: requireAudience(["user"]),
    component: DriverOfferRidePage,
});

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

function DriverOfferRidePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
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
    const {
        driverCars,
        carMode,
        setCarMode,
        selectCarMode,
        selectedCarId,
        setSelectedCarId,
        addLocalCar,
        removeLocalCar,
    } = useDriverCars({ manualBrand, manualModel, manualPlate });

    const etaPreview = useEtaPreview({
        pickupCity,
        dropoffCity,
        rideDate,
        rideTime,
    });

    // Submission/server state — not form fields, so they stay in useState.
    const [publishedMessage, setPublishedMessage] = useState("");
    const [publishError, setPublishError] = useState("");

    // Clear a stale publish error as soon as any field of the form changes.
    const formKey = `${pickupCity?.id ?? ""}|${dropoffCity?.id ?? ""}|${rideDate?.toISOString() ?? ""}|${rideTime}|${seats}|${price}|${carMode}|${selectedCarId}|${manualBrand}|${manualModel}|${manualPlate}`;
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
                navigate({ to: "/driver/rides" });
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
            arrivalEstimateAt: etaPreview.arrivalEstimateAt,
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

                try {
                    await publishRide(carId);
                } catch (publishError) {
                    // If we just created the car and ride publishing failed, delete the car so it doesn't clutter the user's profile
                    if (!alreadySaved) {
                        try {
                            await deleteCarsById(carId);
                            removeLocalCar(carId);
                            await queryClient.invalidateQueries({
                                queryKey: getGetCarsMeQueryKey(),
                            });
                        } catch (e) {
                            console.error("Failed to delete unused car", e);
                        }
                    }
                    throw publishError;
                }
            } catch (error) {
                console.error("Publish ride failed", error);
                const errorMsg = getErrorI18nKey(
                    error,
                    {
                        RIDE_DRIVER_ALREADY_HAS_RIDE_IN_TIMEFRAME:
                            "offerRide.overlappingRide",
                    },
                    "offerRide.publishError"
                );
                // Delay setting the error so that the formKey sync (caused by removing the car) completes first
                setTimeout(() => setPublishError(errorMsg), 0);
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
            const errorMsg = getErrorI18nKey(
                error,
                {
                    RIDE_DRIVER_ALREADY_HAS_RIDE_IN_TIMEFRAME:
                        "offerRide.overlappingRide",
                },
                "offerRide.publishError"
            );
            setTimeout(() => setPublishError(errorMsg), 0);
        }
    };

    const { t } = useTranslation();

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <DriverNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <FormProvider {...methods}>
                    <OfferRideForm
                        dateLocale={datePickerLocale}
                        today={offerRideToday}
                        etaPreview={etaPreview}
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
                    <p className="mt-4 w-full rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-text">
                        {t(publishError)}
                    </p>
                )}
            </div>
        </div>
    );
}
