import { Elysia } from "elysia";
import { CarService } from "./car.service";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { createErrorHandler } from "../auth/auth.errors";
import { CarError, carErrorToHttpStatus } from "./car.errors";
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
    .onError(createErrorHandler(CarError, carErrorToHttpStatus))
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app
            .get("/country-codes", () => CountryCodeList, {
                response: {
                    200: "CountryCodeResponseList",
                    429: "ErrorResponse",
                },
                detail: {
                    description: "Returns all available European country codes",
                },
            })

            .get(
                "/brands",
                async () => await CarService.getAllCarBrandNames(),
                {
                    response: {
                        200: "CarBrandNameList",
                        429: "ErrorResponse",
                    },
                    detail: { description: "Returns all available car brands" },
                }
            )

            .get(
                "/brands/:brand/models",
                async ({ params }) =>
                    await CarService.getCarModelsByBrand(params.brand),
                {
                    params: CarBrandParamsSchema,
                    response: {
                        200: "CarModelList",
                        429: "ErrorResponse",
                    },
                    detail: {
                        description: "Returns car models for a given brand",
                    },
                }
            )

            .get(
                "/me",
                async ({ user }) => await CarService.getCarsByUserId(user.id),
                {
                    response: {
                        200: "CarListItemList",
                        429: "ErrorResponse",
                    },
                    detail: { description: "Returns the current user's cars" },
                }
            )

            .post(
                "/me",
                async ({ user, body, status }) => {
                    const car = await CarService.createCar(user.id, body);
                    return status(201, car);
                },
                {
                    body: "CreateCarBody",
                    response: {
                        201: "Car",
                        400: "ErrorResponse",
                        409: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Creates a new car for the current user",
                    },
                }
            )

            .patch(
                "/:id/status",
                async ({ user, params, body }) =>
                    await CarService.updateCarStatus(params.id, user.id, body),
                {
                    params: CarIdParamsSchema,
                    body: "UpdateCarStatusBody",
                    response: {
                        200: "Car",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Updates whether the current user's car is active",
                    },
                }
            )

            .delete(
                "/:id",
                async ({ user, params }) =>
                    await CarService.deleteCar(params.id, user.id),
                {
                    params: CarIdParamsSchema,
                    response: {
                        200: "Car",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
                        429: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Soft-deletes the current user's car. Rejects with CAR_IN_USE if the car has an active (PLANNED/IN_PROGRESS) ride.",
                    },
                }
            )
    );
