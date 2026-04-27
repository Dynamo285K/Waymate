import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../db";
import { cars as carsTable } from "../../db/schema/car";
import { carModels as carModelsTable } from "../../db/schema/car_model";
import type { Car, CarModel, CarListItem } from "./car.types";
import type { CreateCarBody } from "@repo/shared";
import { CarErrors } from "./car.errors";
import { hasPostgresErrorCode, PostgresErrorCodes } from "../../db/errors";

const findAllCarBrandNames = async (): Promise<{ brand: string }[]> => {
    return await db
        .selectDistinct({ brand: carModelsTable.brand })
        .from(carModelsTable)
        .orderBy(carModelsTable.brand);
};

const findCarModelsByBrand = async (brandName: string): Promise<CarModel[]> => {
    return await db
        .select()
        .from(carModelsTable)
        .where(eq(carModelsTable.brand, brandName))
        .orderBy(carModelsTable.modelName);
};

const findCarsByUserId = async (userId: string): Promise<CarListItem[]> => {
    const result = await db
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

const createCar = async (userId: string, data: CreateCarBody): Promise<Car> => {
    try {
        const [newCar] = await db
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

const updateCarStatus = async (
    carId: string,
    userId: string,
    isActive: boolean
): Promise<Car | null> => {
    const [updatedCar] = await db
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
    carId: string,
    userId: string
): Promise<Car | null> => {
    const [deletedCar] = await db
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
    createCar,
    deleteCar,
    updateCarStatus,
};
