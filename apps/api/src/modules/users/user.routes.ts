import { Elysia } from "elysia";
import { UserService } from "./user.service";
import { isAuthenticated } from "../auth/auth.middleware";
import { UserError, userErrorToHttpStatus } from "./user.errors";
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
    .onError(({ code, status, error }) => {
        if (error instanceof UserError) {
            return status(userErrorToHttpStatus(error.code), {
                error: error.code,
            });
        }
        if (code === "VALIDATION" || code === "PARSE") {
            return status(400, { error: "VALIDATION" });
        }
        if (code === 401) {
            return status(401, { error: "UNAUTHORIZED" });
        }
        if (code === "INTERNAL_SERVER_ERROR" || code === "UNKNOWN") {
            return status(500, { error: "INTERNAL_SERVER_ERROR" });
        }
    })
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
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Updates the current user's profile",
                    },
                }
            )
    );
