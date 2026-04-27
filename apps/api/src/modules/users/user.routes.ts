import { Elysia } from "elysia";
import { UserService } from "./user.service";
import { isAuthenticated } from "../auth/auth.middleware";
import { UserErrors } from "./user.errors";
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
    .use(isAuthenticated)
    .guard({ auth: true }, (app) =>
        app
            .get(
                "/me",
                async ({ user, status }) => {
                    const dbUser = await UserService.getUserById(user.id);

                    if (!dbUser) {
                        return status(404, { error: UserErrors.UserNotFound });
                    }

                    return dbUser;
                },
                {
                    response: {
                        200: "User",
                        404: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: { description: "Returns the current user data" },
                }
            )

            .patch(
                "/me/onboarding",
                async ({ user, body, status }) => {
                    const updatedUser = await UserService.onboardUser(
                        user.id,
                        body
                    );

                    if (!updatedUser) {
                        return status(404, { error: UserErrors.UserNotFound });
                    }

                    return updatedUser;
                },
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
                async ({ user, body, status }) => {
                    const updatedUser = await UserService.updateUserProfile(
                        user.id,
                        body
                    );

                    if (!updatedUser) {
                        return status(404, { error: UserErrors.UserNotFound });
                    }

                    return updatedUser;
                },
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
