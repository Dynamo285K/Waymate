import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { SubmitHandler, UseFormSetError } from "react-hook-form";
import {
    usePostRides,
    getGetRidesMeQueryKey,
} from "../../../../api-client/rides/rides";
import type { LocationSuggestion } from "../../../../components/shared/LocationAutocomplete";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import {
    buildCreateRideBody,
    normalizePlate,
    validateManualCarFields,
} from "../-lib/offer-ride";
import type {
    OfferRideFormInput,
    OfferRideFormValues,
} from "../-components/schema";
import type { useDriverCars } from "./useDriverCars";
import type { EtaPreview } from "./useEtaPreview";
import { useManualCarCreator, type CarModelOption } from "./useManualCarCreator";

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
 * Owns the offer-ride submission flow: the imperative manual-mode validation,
 * the create-car-then-publish orchestration (including rolling back a
 * just-created car when publishing fails, via {@link useManualCarCreator}), the
 * publish mutation, and the resulting `publishedMessage` / `publishError` state.
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

    const { driverCars, carMode, selectedCarId } = car;
    const { createCar, deleteCreatedCar } = useManualCarCreator({
        car,
        modelsData,
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

    // Both submit paths surface a failed publish the same way: log it, map the
    // known overlap error, and defer the state write so any formKey sync (e.g.
    // from removing a just-created car) settles first.
    function reportPublishError(error: unknown) {
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

    async function submitManual(submitted: OfferRideFormValues) {
        const { errors, normalized } = validateManualCarFields(submitted);
        if (errors.length > 0) {
            for (const fieldError of errors) {
                setError(fieldError.field, { message: fieldError.message });
            }
            return;
        }
        const { brand, model, plate } = normalized;

        const alreadySaved = driverCars.find(
            (existing) =>
                existing.brand.toLowerCase() === brand.toLowerCase() &&
                existing.model.toLowerCase() === model.toLowerCase() &&
                normalizePlate(existing.plate) === plate
        );

        try {
            const carId =
                alreadySaved?.id ??
                (await createCar({ brand, model, plate, seats }));

            if (!carId) {
                setPublishError("offerRide.carCreateError");
                return;
            }

            try {
                await publishRide(carId);
            } catch (rideError) {
                // Roll back a car we just created when publishing failed.
                if (!alreadySaved) {
                    await deleteCreatedCar(carId);
                }
                throw rideError;
            }
        } catch (error) {
            reportPublishError(error);
        }
    }

    const onSubmit: SubmitHandler<OfferRideFormValues> = async (submitted) => {
        // Duration is validated by the schema resolver — reaching here means
        // it is already > 0.
        setPublishedMessage("");

        if (carMode === "manual") {
            await submitManual(submitted);
            return;
        }

        if (!selectedCarId) {
            setPublishError("offerRide.missingFieldsError");
            return;
        }

        try {
            await publishRide(selectedCarId);
        } catch (error) {
            reportPublishError(error);
        }
    };

    return { onSubmit, publishError, publishedMessage };
}
