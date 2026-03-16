import { HealthService } from "./health.service";

export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    getHealth() {
        return this.healthService.getHealth();
    }
}
