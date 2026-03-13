import { Elysia } from "elysia";
import { env } from "./config/env";
import { healthRoutes } from "./modules/health/health.routes";

const app = new Elysia()
    .get("/", () => ({
        message: "Waymate API is running",
    }))
    .use(healthRoutes)
    .listen(env.PORT);

console.log(`API running on http://${app.server?.hostname}:${app.server?.port}`);
