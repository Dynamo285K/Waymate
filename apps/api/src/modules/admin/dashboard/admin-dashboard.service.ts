import type { AdminDashboardResponse } from "@repo/shared";
import { db } from "../../../db";
import { AdminDashboardRepository } from "./admin-dashboard.repository";

const getDashboard = async (): Promise<AdminDashboardResponse> => {
    return await AdminDashboardRepository.getDashboardMetrics(db);
};

export const AdminDashboardService = {
    getDashboard,
};
