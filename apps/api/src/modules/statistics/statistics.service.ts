import type { AdminDashboardResponse } from "@repo/shared";
import { db } from "../../db";
import { StatisticsRepository } from "./statistics.repository";

const getDashboard = async (): Promise<AdminDashboardResponse> => {
    return await StatisticsRepository.getDashboardMetrics(db);
};

export const StatisticsService = {
    getDashboard,
};
