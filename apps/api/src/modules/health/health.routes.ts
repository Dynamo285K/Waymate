import { Elysia } from "elysia";
import { HealthResponseSchema } from "@repo/shared";
import { HealthService } from "./health.service";

export const HealthRoutes = new Elysia({ prefix: "/health", tags: ["Health"] })
    .model({
        HealthResponse: HealthResponseSchema,
    })
    .get(
        "/",
        async ({ status }) => {
            const health = await HealthService.getHealth();
            const httpStatus = health.status === "ok" ? 200 : 503;
            return status(httpStatus, health);
        },
        {
            response: {
                200: "HealthResponse",
                503: "HealthResponse",
            },
            detail: {
                description:
                    "Readiness probe — verifies the API process is responsive and the database is reachable.",
            },
        }
    );
