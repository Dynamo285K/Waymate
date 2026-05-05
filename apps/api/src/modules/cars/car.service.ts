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
    return mapPostgresErrors(
        () => CarRepository.insertCar(db, userId, data),
        {
            [PostgresErrorCodes.ForeignKeyViolation]: () => {
                throw new CarError(CarErrorCodes.ModelNotFound);
            },
            [PostgresErrorCodes.UniqueViolation]: () => {
                throw new CarError(CarErrorCodes.DuplicatePlate);
            },
        }
    );
};

const deleteCar = async (carId: string, userId: string) => {
    const deleted = await CarRepository.deleteCar(db, carId, userId);
    if (!deleted) {
        throw new CarError(CarErrorCodes.CarNotFound);
    }
    return deleted;
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
