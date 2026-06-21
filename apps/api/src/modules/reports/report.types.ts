import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { reports } from "../../db/schema/report";
import type { ReportType, RideId } from "@repo/shared";

export type Report = InferSelectModel<typeof reports>;

export type ReportInsert = InferInsertModel<typeof reports>;

export type ReportStatus = Report["reportStatus"];

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
