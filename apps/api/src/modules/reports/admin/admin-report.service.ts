import type {
    AdminReportConversation,
    AdminReportDetailResponse,
    AdminReportListResponse,
    ReportStatus,
} from "@repo/shared";
import { db } from "../../../db";
import { logger } from "../../../shared/logger";
import { ReportError, ReportErrorCodes } from "../report.errors";
import { AdminReportRepository } from "./admin-report.repository";
import type {
    AdminReportListFilters,
    SetReportStatusInput,
} from "./admin-report.types";

const STATUS_HISTORY_DEFAULT_LIMIT = 50;
const REPORT_CONVERSATION_MESSAGE_LIMIT = 500;

const ALLOWED_REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
    OPEN: ["INVESTIGATING", "RESOLVED", "DISMISSED"],
    INVESTIGATING: ["RESOLVED", "DISMISSED"],
    RESOLVED: [],
    DISMISSED: [],
};

const REPORT_STATUSES_REQUIRING_REASON: ReportStatus[] = [
    "RESOLVED",
    "DISMISSED",
];

const getReportList = async (
    filters: AdminReportListFilters
): Promise<AdminReportListResponse> => {
    let cursorPosition: { id: string; createdAt: Date } | undefined;

    if (filters.cursor) {
        const createdAt = await AdminReportRepository.findReportCreatedAt(
            db,
            filters.cursor
        );
        if (!createdAt) return { items: [], nextCursor: null };
        cursorPosition = { id: filters.cursor, createdAt };
    }

    const rows = await AdminReportRepository.findReportList(db, {
        limit: filters.limit + 1,
        status: filters.status,
        reportType: filters.reportType,
        search: filters.search,
        cursorPosition,
    });

    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items, nextCursor };
};

const getReportDetail = async (
    reportId: string
): Promise<AdminReportDetailResponse> => {
    const [report, statusHistory] = await Promise.all([
        AdminReportRepository.findReportDetailById(db, reportId),
        AdminReportRepository.findReportStatusHistoryByReportId(
            db,
            reportId,
            STATUS_HISTORY_DEFAULT_LIMIT
        ),
    ]);

    if (!report) {
        throw new ReportError(ReportErrorCodes.ReportNotFound);
    }

    return { report, statusHistory };
};

const getReportConversation = async (
    reportId: string,
    actorId: string
): Promise<AdminReportConversation> => {
    const report = await AdminReportRepository.findReportDetailById(
        db,
        reportId
    );
    if (!report) {
        throw new ReportError(ReportErrorCodes.ReportNotFound);
    }

    const empty: AdminReportConversation = {
        available: false,
        conversationId: null,
        participants: [],
        messages: [],
    };

    if (!report.rideId) return empty;

    const conversation =
        await AdminReportRepository.findConversationIdForReport(db, reportId);
    if (!conversation) return empty;

    const messages =
        await AdminReportRepository.findConversationMessagesForReport(
            db,
            conversation.conversationId,
            REPORT_CONVERSATION_MESSAGE_LIMIT
        );

    logger.info(
        {
            adminId: actorId,
            reportId,
            conversationId: conversation.conversationId,
            messageCount: messages.length,
        },
        "admin_read_report_conversation"
    );

    return {
        available: true,
        conversationId: conversation.conversationId,
        participants: [report.reporter, report.target].map((u) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            profilePhotoUrl: u.profilePhotoUrl,
        })),
        messages,
    };
};

const setReportStatus = async ({
    actorId,
    reportId,
    newStatus,
    reason,
}: SetReportStatusInput): Promise<AdminReportDetailResponse> => {
    if (
        REPORT_STATUSES_REQUIRING_REASON.includes(newStatus) &&
        (!reason || reason.trim().length === 0)
    ) {
        throw new ReportError(ReportErrorCodes.ReportReasonRequired);
    }

    return await db.transaction(async (tx) => {
        const report = await AdminReportRepository.findReportForAdminUpdate(
            tx,
            reportId
        );

        if (!report) {
            throw new ReportError(ReportErrorCodes.ReportNotFound);
        }

        if (report.reportStatus !== newStatus) {
            const allowed =
                ALLOWED_REPORT_TRANSITIONS[report.reportStatus] ?? [];
            if (!allowed.includes(newStatus)) {
                throw new ReportError(ReportErrorCodes.ReportInvalidTransition);
            }

            const trimmedReason = reason?.trim() ?? null;
            const resolutionReason = REPORT_STATUSES_REQUIRING_REASON.includes(
                newStatus
            )
                ? trimmedReason
                : null;

            const updated = await AdminReportRepository.updateReportStatusById(
                tx,
                reportId,
                newStatus,
                resolutionReason
            );

            if (!updated) {
                throw new ReportError(ReportErrorCodes.ReportNotFound);
            }

            await AdminReportRepository.insertReportStatusHistoryRow(tx, {
                reportId: updated.id,
                oldStatus: report.reportStatus,
                newStatus,
                changedByUserId: actorId,
                reason: trimmedReason,
            });
        }

        const [detail, statusHistory] = await Promise.all([
            AdminReportRepository.findReportDetailById(tx, reportId),
            AdminReportRepository.findReportStatusHistoryByReportId(
                tx,
                reportId,
                STATUS_HISTORY_DEFAULT_LIMIT
            ),
        ]);

        if (!detail) {
            throw new ReportError(ReportErrorCodes.ReportNotFound);
        }

        return { report: detail, statusHistory };
    });
};

export const AdminReportService = {
    getReportList,
    getReportDetail,
    getReportConversation,
    setReportStatus,
};
