import { Elysia } from "elysia";
import { HealthRepository } from "./health.repository";
import { HealthService } from "./health.service";
import { HealthController } from "./health.controller";

const healthRepository = new HealthRepository();
const healthService = new HealthService(healthRepository);
const healthController = new HealthController(healthService);

export const healthRoutes = new Elysia({ prefix: "/health" }).get("/", () =>
    healthController.getHealth()
);
