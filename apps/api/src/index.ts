import { Elysia } from "elysia";
import { env } from "./config/env";

const app = new Elysia()
    .get("/", () => ({
        message: "Waymate API is running",
    }))
    .get("/health", () => ({
        status: "ok",
    }))
    .listen(env.PORT);

console.log(`API running on http://${app.server?.hostname}:${app.server?.port}`);
