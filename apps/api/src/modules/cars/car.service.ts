import { CarRepository } from "./car.repository";
import type { CreateCarBody, UpdateCarStatusBody } from "./car.types";

const getAllCarBrandNames = async () => {
    return await CarRepository.findAllCarBrandNames();
};

const getCarModelsByBrand = async (brandName: string) => {
    return await CarRepository.findCarModelsByBrand(brandName);
};

const getCarsByUserId = async (userId: string) => {
    return await CarRepository.findCarsByUserId(userId);
};

const createCar = async (userId: string, data: CreateCarBody) => {
    return await CarRepository.createCar(userId, data);
};

const deleteCar = async (carId: string, userId: string) => {
    return await CarRepository.deleteCar(carId, userId);
};

const updateCarStatus = async (
    carId: string,
    userId: string,
    data: UpdateCarStatusBody
) => {
    return await CarRepository.updateCarStatus(carId, userId, data.isActive);
};

export const CarService = {
    getAllCarBrandNames,
    getCarModelsByBrand,
    getCarsByUserId,
    createCar,
    deleteCar,
    updateCarStatus,
};
