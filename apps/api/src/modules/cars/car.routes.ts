import { Elysia } from "elysia";
import { CarService } from "./car.service";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { CarErrors } from "./car.errors";
import {
    ErrorResponseSchema,
    CarSchema,
    CarListItemSchema,
    CarModelSchema,
    CreateCarBodySchema,
    CarIdParamsSchema,
    UpdateCarStatusBodySchema,
    CarBrandNameListSchema,
    CarBrandParamsSchema,
    CountryCodeList,
    CountryCodeSchema,
} from "@repo/shared";

export const CarRoutes = new Elysia({ prefix: "/cars", tags: ["Cars"] })
    .model({
        Car: CarSchema,
        CarListItem: CarListItemSchema,
        CarListItemList: CarListItemSchema.array(),
        CarModel: CarModelSchema,
        CarModelList: CarModelSchema.array(),
        CarIdParams: CarIdParamsSchema,
        CreateCarBody: CreateCarBodySchema,
        UpdateCarStatusBody: UpdateCarStatusBodySchema,
        ErrorResponse: ErrorResponseSchema,
        CountryCodeResponseList: CountryCodeSchema.array(),
        CarBrandNameList: CarBrandNameListSchema,
        CarBrandParams: CarBrandParamsSchema,
    })
    .onError(({ code, status }) => {
        if (code === "VALIDATION" || code === "PARSE") {
            return status(400, { error: "Invalid request data" });
        }
        if (code === 401) {
            return status(401, { error: "Unauthorized" });
        }
        if (code === "INTERNAL_SERVER_ERROR" || code === "UNKNOWN") {
            return status(500, { error: "Internal server error" });
        }
    })
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app
            .get("/country-codes", () => CountryCodeList, {
                response: { 200: "CountryCodeResponseList" },
                detail: {
                    description: "Returns all available European country codes",
                },
            })

            .get(
                "/brands",
                async () => await CarService.getAllCarBrandNames(),
                {
                    response: { 200: "CarBrandNameList" }, // Definované v predchádzajúcom modeli
                    detail: { description: "Returns all available car brands" },
                }
            )

            .get(
                "/brands/:brand/models",
                async ({ params }) =>
                    await CarService.getCarModelsByBrand(params.brand),
                {
                    params: "CarBrandParams",
                    response: { 200: "CarModelList" },
                    detail: {
                        description: "Returns car models for a given brand",
                    },
                }
            )

            .get(
                "/me",
                async ({ user }) => await CarService.getCarsByUserId(user.id),
                {
                    response: { 200: "CarListItemList" },
                    detail: { description: "Returns the current user's cars" },
                }
            )

            .post(
                "/me",
                async ({ user, body, status }) => {
                    try {
                        const car = await CarService.createCar(user.id, body);
                        return status(201, car);
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        if (message === CarErrors.ModelNotFound) {
                            return status(400, {
                                error: "Selected car model does not exist",
                            });
                        }
                        if (message === CarErrors.DuplicatePlate) {
                            return status(409, {
                                error: "Car with this plate and country code already exists",
                            });
                        }

                        return status(500, { error: "Failed to create car" });
                    }
                },
                {
                    body: "CreateCarBody",
                    response: {
                        201: "Car",
                        400: "ErrorResponse",
                        409: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Creates a new car for the current user",
                    },
                }
            )

            .patch(
                "/:id/status",
                async ({ user, params, body, status }) => {
                    const updatedCar = await CarService.updateCarStatus(
                        params.id,
                        user.id,
                        body
                    );

                    if (!updatedCar) {
                        return status(404, { error: "Car not found" });
                    }

                    return updatedCar;
                },
                {
                    params: "CarIdParams",
                    body: "UpdateCarStatusBody",
                    response: {
                        200: "Car",
                        404: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Updates whether the current user's car is active",
                    },
                }
            )

            .delete(
                "/:id",
                async ({ user, params, status }) => {
                    const deletedCar = await CarService.deleteCar(
                        params.id,
                        user.id
                    );

                    if (!deletedCar) {
                        return status(404, { error: "Car not found" });
                    }

                    return deletedCar;
                },
                {
                    params: "CarIdParams",
                    response: {
                        200: "Car",
                        404: "ErrorResponse",
                    },
                    detail: {
                        description: "Soft-deletes the current user's car",
                    },
                }
            )
    );
