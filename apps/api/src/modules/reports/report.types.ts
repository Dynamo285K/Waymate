import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { reports } from "../../db/schema/report";
import type { ReportType, RideId } from "@repo/shared";

// ==========================================
// 1. BASE DATABASE TYPES (SELECT)
// ==========================================
export type Report = InferSelectModel<typeof reports>;

// ==========================================
// 2. DATABASE TYPES FOR INSERTION (INSERT)
// ==========================================
export type ReportInsert = InferInsertModel<typeof reports>;

// ==========================================
// 3. SPECIFIC PROPERTIES AND ALIASES
// ==========================================
export type ReportStatus = Report["reportStatus"];

// ==========================================
// 4. SERVICE / REPOSITORY CONTRACTS (COMPOSITE TYPES)
// ==========================================

// Data passed from the service layer to the repository when creating a report.
export type CreateReportInput = {
    reporterId: string;
    targetUserId: string;
    rideId?: RideId;
    reportType: ReportType;
    description: string;
    // When true, also add the target to the reporter's personal block list as
    // part of the same transaction.
    blockTarget?: boolean;
};
