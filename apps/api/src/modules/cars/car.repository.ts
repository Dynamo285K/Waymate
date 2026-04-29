import { eq, and, isNull } from "drizzle-orm";
import type { Executor } from "../../db";
import { cars as carsTable } from "../../db/schema/car";
import { carModels as carModelsTable } from "../../db/schema/car_model";
import type { Car, CarModel, CarListItem } from "./car.types";
import type { CreateCarBody } from "@repo/shared";

const findAllCarBrandNames = async (
    executor: Executor
): Promise<{ brand: string }[]> => {
    return await executor
        .selectDistinct({ brand: carModelsTable.brand })
        .from(carModelsTable)
        .orderBy(carModelsTable.brand);
};

const findCarModelsByBrand = async (
    executor: Executor,
    brandName: string
): Promise<CarModel[]> => {
    return await executor
        .select()
        .from(carModelsTable)
        .where(eq(carModelsTable.brand, brandName))
        .orderBy(carModelsTable.modelName);
};

const findCarsByUserId = async (
    executor: Executor,
    userId: string
): Promise<CarListItem[]> => {
    const result = await executor
        .select({
            id: carsTable.id,
            ownerId: carsTable.ownerId,
            modelId: carsTable.modelId,
            brand: carModelsTable.brand,
            modelName: carModelsTable.modelName,
            spz: carsTable.spz,
            countryCode: carsTable.countryCode,
            color: carsTable.color,
            seatsTotal: carsTable.seatsTotal,
            isActive: carsTable.isActive,
            createdAt: carsTable.createdAt,
            updatedAt: carsTable.updatedAt,
        })
        .from(carsTable)
        .innerJoin(carModelsTable, eq(carsTable.modelId, carModelsTable.id))
        .where(and(eq(carsTable.ownerId, userId), isNull(carsTable.deletedAt)));

    return result as CarListItem[];
};

const insertCar = async (
    executor: Executor,
    userId: string,
    data: CreateCarBody
): Promise<Car> => {
    const [newCar] = await executor
        .insert(carsTable)
        .values({
            ownerId: userId,
            modelId: data.modelId,
            spz: data.spz,
            countryCode: data.countryCode,
            color: data.color,
            seatsTotal: data.seatsTotal,
        })
        .returning();

    return newCar as Car;
};

const updateCarStatus = async (
    executor: Executor,
    carId: string,
    userId: string,
    isActive: boolean
): Promise<Car | null> => {
    const [updatedCar] = await executor
        .update(carsTable)
        .set({
            isActive: isActive,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(carsTable.id, carId),
                eq(carsTable.ownerId, userId),
                isNull(carsTable.deletedAt)
            )
        )
        .returning();

    return updatedCar ?? null;
};

const deleteCar = async (
    executor: Executor,
    carId: string,
    userId: string
): Promise<Car | null> => {
    const [deletedCar] = await executor
        .update(carsTable)
        .set({
            updatedAt: new Date(),
            deletedAt: new Date(),
            isActive: false,
        })
        .where(
            and(
                eq(carsTable.id, carId),
                eq(carsTable.ownerId, userId),
                isNull(carsTable.deletedAt)
            )
        )
        .returning();

    return deletedCar ?? null;
};

export const CarRepository = {
    findAllCarBrandNames,
    findCarModelsByBrand,
    findCarsByUserId,
    insertCar,
    deleteCar,
    updateCarStatus,
};
