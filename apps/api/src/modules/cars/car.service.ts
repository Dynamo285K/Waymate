import { db } from "../../db";
import { hasPostgresErrorCode, PostgresErrorCodes } from "../../db/errors";
import { CarRepository } from "./car.repository";
import { CarErrors } from "./car.errors";
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
    try {
        return await CarRepository.insertCar(db, userId, data);
    } catch (error) {
        if (
            hasPostgresErrorCode(error, PostgresErrorCodes.ForeignKeyViolation)
        ) {
            throw new Error(CarErrors.ModelNotFound);
        }
        if (hasPostgresErrorCode(error, PostgresErrorCodes.UniqueViolation)) {
            throw new Error(CarErrors.DuplicatePlate);
        }
        throw error;
    }
};

const deleteCar = async (carId: string, userId: string) => {
    return await CarRepository.deleteCar(db, carId, userId);
};

const updateCarStatus = async (
    carId: string,
    userId: string,
    data: UpdateCarStatusBody
) => {
    return await CarRepository.updateCarStatus(
        db,
        carId,
        userId,
        data.isActive
    );
};

export const CarService = {
    getAllCarBrandNames,
    getCarModelsByBrand,
    getCarsByUserId,
    createCar,
    deleteCar,
    updateCarStatus,
};
