import { db } from "../../db";
import { env } from "../../config/env";
import { HealthRepository } from "./health.repository";
import type { HealthResponse } from "@repo/shared";

const getHealth = async (): Promise<HealthResponse> => {
    const dbUp = await HealthRepository.pingDatabase(db);

    return {
        status: dbUp ? "ok" : "degraded",
        db: dbUp ? "up" : "down",
        commit: env.RENDER_GIT_COMMIT,
    };
};

export const HealthService = {
    getHealth,
};
