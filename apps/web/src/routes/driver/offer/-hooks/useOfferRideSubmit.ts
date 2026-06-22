import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { SubmitHandler, UseFormSetError } from "react-hook-form";
import {
    getCarsBrandsByBrandModels,
    getCarsMe,
    deleteCarsById,
    usePostCarsMe,
    getGetCarsMeQueryKey,
} from "../../../../api-client/cars/cars";
import {
    usePostRides,
    getGetRidesMeQueryKey,
} from "../../../../api-client/rides/rides";
import type { CreateCarBody as ApiCreateCarBody } from "../../../../api-client/model/createCarBody";
import { PLATE_MAX_LENGTH, PLATE_MIN_LENGTH } from "@repo/shared/validation";
import type { LocationSuggestion } from "../../../../components/shared/LocationAutocomplete";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import {
    buildCreateRideBody,
    normalizePlate,
    parsePositiveInteger,
} from "../-lib/offer-ride";
import type { OfferRideCar } from "../-components/OfferRideForm";
import type {
    OfferRideFormInput,
    OfferRideFormValues,
} from "../-components/schema";
import type { useDriverCars } from "./useDriverCars";
import type { EtaPreview } from "./useEtaPreview";

// The manual-car form only ever creates Slovak cars; colour is left unset.
type CreateCarBody = ApiCreateCarBody & {
    countryCode: "SK";
    color: "OTHER";
};

type CreatedCarRow = {
    id: string;
};

type CarModelOption = {
    id: number;
    brand: string;
    modelName: string;
};

// The subset of the form's live values the submit flow reads. They come from
// the page's `useWatch` so the publish-error reset stays reactive.
type OfferRideSubmitValues = {
    pickupCity: LocationSuggestion | null;
    dropoffCity: LocationSuggestion | null;
    rideDate: Date | undefined;
    rideTime: string;
    seats: string;
    price: string;
    manualBrand: string;
    manualModel: string;
    manualPlate: string;
};

type UseOfferRideSubmitParams = {
    values: OfferRideSubmitValues;
    car: ReturnType<typeof useDriverCars>;
    etaPreview: EtaPreview;
    modelsData: CarModelOption[] | undefined;
    setError: UseFormSetError<OfferRideFormInput>;
};

/**
 * Owns the offer-ride submission flow: the publish/manual-car mutations, the
 * imperative manual-mode validation, the create-car-then-publish orchestration
 * (including rolling back a just-created car when publishing fails), and the
 * resulting `publishedMessage` / `publishError` state. Behaviour matches the
 * previous inline page implementation.
 */
export function useOfferRideSubmit({
    values,
    car,
    etaPreview,
    modelsData,
    setError,
}: UseOfferRideSubmitParams) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        driverCars,
        carMode,
        setCarMode,
        selectedCarId,
        setSelectedCarId,
        addLocalCar,
        removeLocalCar,
    } = car;

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
    } = values;

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

    async function getManualModelId() {
        const brand = manualBrand.trim();
        const model = manualModel.trim();
        const cachedModel = modelsData?.find(
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
                (existing) => normalizePlate(existing.spz) === normalizedPlate
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

    const onSubmit: SubmitHandler<OfferRideFormValues> = async (submitted) => {
        // Duration is validated by the schema resolver — reaching here means
        // it is already > 0.
        setPublishedMessage("");

        if (carMode === "manual") {
            const brand = submitted.manualBrand.trim();
            const model = submitted.manualModel.trim();
            const plate = normalizePlate(submitted.manualPlate);

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
                (existing) =>
                    existing.brand.toLowerCase() === brand.toLowerCase() &&
                    existing.model.toLowerCase() === model.toLowerCase() &&
                    normalizePlate(existing.plate) === plate
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
                } catch (rideError) {
                    // If we just created the car and ride publishing failed,
                    // delete the car so it doesn't clutter the user's profile.
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
                    throw rideError;
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
                // Delay setting the error so the formKey sync (caused by
                // removing the car) completes first.
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

    return { onSubmit, publishError, publishedMessage };
}
