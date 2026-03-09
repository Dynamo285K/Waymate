import { Router } from "express";
import { HealthRepository } from "./health.repository";
import { HealthService } from "./health.service";
import { HealthController } from "./health.controller";

const healthRouter = Router();

const healthRepository = new HealthRepository();
const healthService = new HealthService(healthRepository);
const healthController = new HealthController(healthService);

healthRouter.get("/", (req, res) => healthController.getHealth(req, res));

export { healthRouter };
