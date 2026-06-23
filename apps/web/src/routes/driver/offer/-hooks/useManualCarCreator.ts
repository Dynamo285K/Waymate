import { useQueryClient } from "@tanstack/react-query";
import {
    getCarsBrandsByBrandModels,
    getCarsMe,
    deleteCarsById,
    usePostCarsMe,
    getGetCarsMeQueryKey,
} from "../../../../api-client/cars/cars";
import type { CreateCarBody as ApiCreateCarBody } from "../../../../api-client/model/createCarBody";
import { normalizePlate, parsePositiveInteger } from "../-lib/offer-ride";
import { logger } from "../../../../lib/logger";
import type { OfferRideCar } from "../-components/OfferRideForm";
import type { useDriverCars } from "./useDriverCars";

// The manual-car form only ever creates Slovak cars; colour is left unset.
type CreateCarBody = ApiCreateCarBody & {
    countryCode: "SK";
    color: "OTHER";
};

type CreatedCarRow = {
    id: string;
};

export type CarModelOption = {
    id: number;
    brand: string;
    modelName: string;
};

// Brand/model are already trimmed and the plate already normalized by the
// caller; seats is the raw form string (parsed/guarded here).
type ManualCarInput = {
    brand: string;
    model: string;
    plate: string;
    seats: string;
};

type UseManualCarCreatorParams = {
    car: ReturnType<typeof useDriverCars>;
    modelsData: CarModelOption[] | undefined;
};

/**
 * Owns creating (and rolling back) the ad-hoc car behind a manual-mode ride:
 * resolving the model id, the create-car mutation, deduping against a concurrent
 * duplicate (unique-plate conflict), and registering the new car locally. Split
 * out of {@link useOfferRideSubmit} so that hook stays focused on orchestration.
 */
export function useManualCarCreator({
    car,
    modelsData,
}: UseManualCarCreatorParams) {
    const queryClient = useQueryClient();
    const { setCarMode, setSelectedCarId, addLocalCar, removeLocalCar } = car;

    const createCarMutation = usePostCarsMe({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetCarsMeQueryKey(),
                });
            },
        },
    });

    async function getModelId(brand: string, model: string) {
        const cachedModel = modelsData?.find(
            (row) => row.brand === brand && row.modelName === model
        );

        if (cachedModel) {
            return cachedModel.id;
        }

        const models = await getCarsBrandsByBrandModels(brand);

        return models.find((row) => row.modelName === model)?.id ?? null;
    }

    /**
     * Creates the car and returns its id, or null when the model id or seat
     * count can't be resolved. On a unique-plate conflict it adopts the existing
     * car instead of failing.
     */
    async function createCar({
        brand,
        model,
        plate,
        seats,
    }: ManualCarInput): Promise<string | null> {
        const modelId = await getModelId(brand, model);
        const offeredSeats = parsePositiveInteger(seats);

        if (!modelId || !offeredSeats) {
            return null;
        }

        const createCarBody: CreateCarBody = {
            modelId,
            spz: plate,
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
                (existing) => normalizePlate(existing.spz) === plate
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
            brand,
            model,
            plate,
        };

        addLocalCar(savedCar);
        setSelectedCarId(createdCar.id);
        setCarMode("saved");

        return createdCar.id;
    }

    /**
     * Removes a car that was just created for a ride whose publish then failed,
     * so it doesn't clutter the user's profile. Swallows its own errors.
     */
    async function deleteCreatedCar(carId: string): Promise<void> {
        try {
            await deleteCarsById(carId);
            removeLocalCar(carId);
            await queryClient.invalidateQueries({
                queryKey: getGetCarsMeQueryKey(),
            });
        } catch (e) {
            logger.error("Failed to delete unused car", e);
        }
    }

    return { createCar, deleteCreatedCar };
}
