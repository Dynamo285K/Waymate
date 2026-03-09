import { HealthRepository } from "./health.repository";

export class HealthService {
    constructor(private readonly healthRepository: HealthRepository) {}

    getHealth() {
        return this.healthRepository.getStatus();
    }
}
