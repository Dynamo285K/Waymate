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
    .use(isAuthenticated)
    .guard({ auth: true }, (app) =>
        app
            .get(
                "/me",
                async ({ user, set }) => {
                    const dbUser = await UserService.getUserById(user.id);

                    if (!dbUser) {
                        set.status = 404;
                        return { error: "User not found" };
                    }

                    return dbUser;
                },
                {
                    response: { 200: "User", 404: "ErrorResponse" },
                    detail: { description: "Returns the current user data" },
                }
            )

            .patch(
                "/me/onboarding",
                async ({ user, body }) => {
                    return await UserService.onboardUser(user.id, body);
                },
                {
                    body: "OnboardingUserBody",
                    response: { 200: "User" },
                    detail: {
                        description: "Updates user data during onboarding",
                    },
                }
            )

            .patch(
                "/me/profile",
                async ({ user, body }) => {
                    return await UserService.updateUserProfile(user.id, body);
                },
                {
                    body: "UpdateUserBody",
                    response: { 200: "User" },
                    detail: {
                        description: "Updates the current user's profile",
                    },
                }
            )
    );
