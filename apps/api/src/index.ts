import { Elysia } from "elysia";
import { isAuthenticated } from "./modules/auth/auth.middleware";

const app = new Elysia()
    .use(isAuthenticated)
    .get("/", () => ({ status: "Waymate API is online" }))
    .get(
        "/api/me",
        ({ user }) => ({
            message: `Hello ${user.displayName ?? user.firstName ?? user.email}!`,
            data: user,
        }),
        {
            auth: true,
        }
    )
    .listen(3000);

console.log(
    `Waymate API is running at ${app.server?.hostname}:${app.server?.port}`
);
