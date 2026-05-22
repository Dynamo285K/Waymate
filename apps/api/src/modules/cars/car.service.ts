import { db } from "../../db";
import { mapPostgresErrors, PostgresErrorCodes } from "../../db/errors";
import { CarRepository } from "./car.repository";
import { CarError, CarErrorCodes } from "./car.errors";
import type { CreateCarBody, UpdateCarStatusBody } from "@repo/shared";

const getAllCarBrandNames = async () => {
    return await CarRepository.findAllCarBrandNames(db);
};

const getCarModelsByBrand = async (brandName: string) => {
    return await CarRepository.findCarModelsByBrand(db, brandName);
};

const getCarsByUserId = async (userId: string) => {
    return await CarRepository.findCarsByUserId(db, userId);
};

const createCar = async (userId: string, data: CreateCarBody) => {
    return mapPostgresErrors(() => CarRepository.insertCar(db, userId, data), {
        [PostgresErrorCodes.ForeignKeyViolation]: () => {
            throw new CarError(CarErrorCodes.ModelNotFound);
        },
        [PostgresErrorCodes.UniqueViolation]: () => {
            throw new CarError(CarErrorCodes.DuplicatePlate);
        },
    });
};

const deleteCar = async (carId: string, userId: string) => {
    return await db.transaction(async (tx) => {
        // Soft-delete first (scoped to the owner) so a non-owner / unknown id
        // gets CAR_NOT_FOUND rather than leaking whether someone else's car is
        // in use. The active-ride check then rolls the delete back if needed.
        const deleted = await CarRepository.deleteCar(tx, carId, userId);
        if (!deleted) {
            throw new CarError(CarErrorCodes.CarNotFound);
        }

        const activeRides = await CarRepository.countActiveRidesForCar(
            tx,
            carId
        );
        if (activeRides > 0) {
            throw new CarError(CarErrorCodes.CarInUse);
        }

        return deleted;
    });
};

const updateCarStatus = async (
    carId: string,
    userId: string,
    data: UpdateCarStatusBody
) => {
    const updated = await CarRepository.updateCarStatus(
        db,
        carId,
        userId,
        data.isActive
    );
    if (!updated) {
        throw new CarError(CarErrorCodes.CarNotFound);
    }
    return updated;
};

export const CarService = {
    getAllCarBrandNames,
    getCarModelsByBrand,
    getCarsByUserId,
    createCar,
    deleteCar,
    updateCarStatus,
};
