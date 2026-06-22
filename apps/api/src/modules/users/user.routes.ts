import { Elysia } from "elysia";
import { UserService } from "./user.service";
import { isAuthenticated } from "../auth/auth.middleware";
import { createErrorHandler } from "../auth/auth.errors";
import { UserError, userErrorToHttpStatus } from "./user.errors";
import { AdminUserRoutes } from "./admin/admin-user.routes";
import {
    ErrorResponseSchema,
    OnboardingUserBodySchema,
    UpdateUserBodySchema,
    UserEntitySchema,
} from "@repo/shared";

export const UserRoutes = new Elysia({ prefix: "/users", tags: ["Users"] })
    .model({
        User: UserEntitySchema,
        OnboardingUserBody: OnboardingUserBodySchema,
        UpdateUserBody: UpdateUserBodySchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .onError(createErrorHandler(UserError, userErrorToHttpStatus))
    .use(isAuthenticated)
    .guard({ auth: true }, (app) =>
        app
            .get(
                "/me",
                async ({ user }) => await UserService.getUserById(user.id),
                {
                    response: {
                        200: "User",
                        401: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: { description: "Returns the current user data" },
                }
            )

            .patch(
                "/me/onboarding",
                async ({ user, body }) =>
                    await UserService.onboardUser(user.id, body),
                {
                    body: "OnboardingUserBody",
                    response: {
                        200: "User",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Updates user data during onboarding",
                    },
                }
            )

            .patch(
                "/me/profile",
                async ({ user, body }) =>
                    await UserService.updateUserProfile(user.id, body),
                {
                    body: "UpdateUserBody",
                    response: {
                        200: "User",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Updates the current user's profile",
                    },
                }
            )
    )
    .use(AdminUserRoutes);
