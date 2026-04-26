import { Elysia } from "elysia";
import { z } from "zod";
import { UserService } from "./user.service";
import { isAuthenticated } from "../auth/auth.middleware";
import {
    OnboardingUserBodySchema,
    UpdateUserBodySchema,
    UserEntitySchema,
} from "./user.schema";

const ErrorResponseSchema = z.object({
    error: z.string(),
});

export const UserRoutes = new Elysia({ prefix: "/users", tags: ["Users"] })
    .model({
        User: UserEntitySchema,
        UserList: UserEntitySchema.array(),
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
                    try {
                        const dbUser = await UserService.getUserById(user.id);

                        if (!dbUser) {
                            return status(404, { error: "User not found" });
                        }

                        return dbUser;
                    } catch (error) {
                        console.error("Error fetching user:", error);
                        return status(500, {
                            error: "Failed to fetch user data",
                        });
                    }
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
                    try {
                        const updatedUser = await UserService.onboardUser(
                            user.id,
                            body
                        );
                        return status(200, updatedUser);
                    } catch (error) {
                        console.error("Error during onboarding:", error);
                        return status(500, {
                            error: "Failed to update onboarding data",
                        });
                    }
                },
                {
                    body: "OnboardingUserBody",
                    response: {
                        200: "User",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Updates user data during onboarding (first name, last name, and phone are required)",
                    },
                }
            )

            .patch(
                "/me/profile",
                async ({ user, body, status }) => {
                    try {
                        const updatedUser = await UserService.updateUserProfile(
                            user.id,
                            body
                        );
                        return status(200, updatedUser);
                    } catch (error) {
                        console.error("Error updating profile:", error);
                        return status(500, {
                            error: "Failed to update user profile",
                        });
                    }
                },
                {
                    body: "UpdateUserBody",
                    response: {
                        200: "User",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Updates the current user's profile",
                    },
                }
            )
    );
