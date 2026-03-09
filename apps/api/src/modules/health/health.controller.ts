import type { Request, Response } from "express";
import { HealthService } from "./health.service";

export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    getHealth(_req: Request, res: Response) {
        const result = this.healthService.getHealth();
        return res.status(200).json(result);
    }
}
