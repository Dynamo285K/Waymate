import type { ReportStatus, ReportType } from "@repo/shared";

export type AdminReportListFilters = {
    limit: number;
    cursor?: string;
    status?: ReportStatus;
    reportType?: ReportType;
    search?: string;
};

export type SetReportStatusInput = {
    actorId: string;
    reportId: string;
    newStatus: ReportStatus;
    reason?: string;
};
