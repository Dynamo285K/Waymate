import {
    aliasedTable,
    and,
    asc,
    desc,
    eq,
    ilike,
    isNull,
    lt,
    or,
    sql,
} from "drizzle-orm";
import type {
    AdminReportConversationMessage,
    AdminReportDetail,
    AdminReportListItem,
    AdminReportStatusHistoryItem,
    ReportStatus,
    ReportType,
} from "@repo/shared";
import type { Executor } from "../../../db";
import { users as usersTable } from "../../../db/schema/user";
import { rides as ridesTable } from "../../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../../db/schema/ride_stop";
import { bookings as bookingsTable } from "../../../db/schema/booking";
import { reports as reportsTable } from "../../../db/schema/report";
import { reportStatusHistory as reportStatusHistoryTable } from "../../../db/schema/report_status_history";
import { conversations as conversationsTable } from "../../../db/schema/conversation";
import { messages as messagesTable } from "../../../db/schema/message";

const findReportList = async (
    executor: Executor,
    params: {
        limit: number;
        status?: ReportStatus;
        reportType?: ReportType;
        search?: string;
        cursorPosition?: { id: string; createdAt: Date };
    }
): Promise<AdminReportListItem[]> => {
    const reporter = aliasedTable(usersTable, "admin_report_reporter");
    const target = aliasedTable(usersTable, "admin_report_target");

    const conditions = [isNull(reportsTable.deletedAt)];

    if (params.status) {
        conditions.push(eq(reportsTable.reportStatus, params.status));
    }
    if (params.reportType) {
        conditions.push(eq(reportsTable.reportType, params.reportType));
    }
    if (params.search) {
        const pattern = `%${params.search}%`;
        const searchClause = or(
            ilike(reportsTable.description, pattern),
            ilike(reporter.email, pattern),
            ilike(reporter.firstName, pattern),
            ilike(reporter.lastName, pattern),
            ilike(target.email, pattern),
            ilike(target.firstName, pattern),
            ilike(target.lastName, pattern)
        );
        if (searchClause) conditions.push(searchClause);
    }
    if (params.cursorPosition) {
        const cursorClause = or(
            lt(reportsTable.createdAt, params.cursorPosition.createdAt),
            and(
                eq(reportsTable.createdAt, params.cursorPosition.createdAt),
                lt(reportsTable.id, params.cursorPosition.id)
            )
        );
        if (cursorClause) conditions.push(cursorClause);
    }

    const rows = await executor
        .select({
            id: reportsTable.id,
            reportType: reportsTable.reportType,
            reportStatus: reportsTable.reportStatus,
            description: reportsTable.description,
            rideId: reportsTable.rideId,
            createdAt: reportsTable.createdAt,
            reporterId: reporter.id,
            reporterEmail: reporter.email,
            reporterFirstName: reporter.firstName,
            reporterLastName: reporter.lastName,
            reporterProfilePhotoUrl: reporter.profilePhotoUrl,
            targetId: target.id,
            targetEmail: target.email,
            targetFirstName: target.firstName,
            targetLastName: target.lastName,
            targetProfilePhotoUrl: target.profilePhotoUrl,
        })
        .from(reportsTable)
        .innerJoin(reporter, eq(reportsTable.reporterId, reporter.id))
        .innerJoin(target, eq(reportsTable.targetUserId, target.id))
        .where(and(...conditions))
        .orderBy(desc(reportsTable.createdAt), desc(reportsTable.id))
        .limit(params.limit);

    return rows.map((row) => ({
        id: row.id,
        reportType: row.reportType,
        reportStatus: row.reportStatus,
        description: row.description,
        rideId: row.rideId,
        reporter: {
            id: row.reporterId,
            email: row.reporterEmail,
            firstName: row.reporterFirstName,
            lastName: row.reporterLastName,
            profilePhotoUrl: row.reporterProfilePhotoUrl,
        },
        target: {
            id: row.targetId,
            email: row.targetEmail,
            firstName: row.targetFirstName,
            lastName: row.targetLastName,
            profilePhotoUrl: row.targetProfilePhotoUrl,
        },
        createdAt: row.createdAt,
    }));
};

const findReportCreatedAt = async (
    executor: Executor,
    id: string
): Promise<Date | null> => {
    const [row] = await executor
        .select({ createdAt: reportsTable.createdAt })
        .from(reportsTable)
        .where(and(eq(reportsTable.id, id), isNull(reportsTable.deletedAt)))
        .limit(1);
    return row?.createdAt ?? null;
};

const findReportDetailById = async (
    executor: Executor,
    id: string
): Promise<AdminReportDetail | null> => {
    const reporter = aliasedTable(usersTable, "admin_report_detail_reporter");
    const target = aliasedTable(usersTable, "admin_report_detail_target");
    const originStops = aliasedTable(
        rideStopsTable,
        "admin_report_detail_origin"
    );
    const destStops = aliasedTable(rideStopsTable, "admin_report_detail_dest");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("admin_report_detail_last_stops");

    const [row] = await executor
        .select({
            id: reportsTable.id,
            reportType: reportsTable.reportType,
            reportStatus: reportsTable.reportStatus,
            description: reportsTable.description,
            resolutionReason: reportsTable.resolutionReason,
            rideId: reportsTable.rideId,
            createdAt: reportsTable.createdAt,
            updatedAt: reportsTable.updatedAt,
            reporterId: reporter.id,
            reporterEmail: reporter.email,
            reporterFirstName: reporter.firstName,
            reporterLastName: reporter.lastName,
            reporterProfilePhotoUrl: reporter.profilePhotoUrl,
            targetId: target.id,
            targetEmail: target.email,
            targetFirstName: target.firstName,
            targetLastName: target.lastName,
            targetProfilePhotoUrl: target.profilePhotoUrl,
            rideDepartureAt: ridesTable.departureAt,
            originCity: originStops.city,
            destinationCity: destStops.city,
        })
        .from(reportsTable)
        .innerJoin(reporter, eq(reportsTable.reporterId, reporter.id))
        .innerJoin(target, eq(reportsTable.targetUserId, target.id))
        .leftJoin(ridesTable, eq(reportsTable.rideId, ridesTable.id))
        .leftJoin(
            originStops,
            and(
                eq(originStops.rideId, ridesTable.id),
                eq(originStops.stopOrder, 0)
            )
        )
        .leftJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .leftJoin(
            destStops,
            and(
                eq(destStops.rideId, ridesTable.id),
                eq(destStops.stopOrder, lastStopOrders.stopOrder)
            )
        )
        .where(and(eq(reportsTable.id, id), isNull(reportsTable.deletedAt)))
        .limit(1);

    if (!row) return null;

    return {
        id: row.id,
        reportType: row.reportType,
        reportStatus: row.reportStatus,
        description: row.description,
        resolutionReason: row.resolutionReason,
        rideId: row.rideId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        reporter: {
            id: row.reporterId,
            email: row.reporterEmail,
            firstName: row.reporterFirstName,
            lastName: row.reporterLastName,
            profilePhotoUrl: row.reporterProfilePhotoUrl,
        },
        target: {
            id: row.targetId,
            email: row.targetEmail,
            firstName: row.targetFirstName,
            lastName: row.targetLastName,
            profilePhotoUrl: row.targetProfilePhotoUrl,
        },
        ride:
            row.rideId &&
            row.rideDepartureAt &&
            row.originCity &&
            row.destinationCity
                ? {
                      id: row.rideId,
                      departureAt: row.rideDepartureAt,
                      originCity: row.originCity,
                      destinationCity: row.destinationCity,
                  }
                : null,
    };
};

const findReportStatusHistoryByReportId = async (
    executor: Executor,
    reportId: string,
    limit: number
): Promise<AdminReportStatusHistoryItem[]> => {
    const actor = aliasedTable(usersTable, "report_history_actor");

    const rows = await executor
        .select({
            id: reportStatusHistoryTable.id,
            oldStatus: reportStatusHistoryTable.oldStatus,
            newStatus: reportStatusHistoryTable.newStatus,
            reason: reportStatusHistoryTable.reason,
            createdAt: reportStatusHistoryTable.createdAt,
            actorId: actor.id,
            actorFirstName: actor.firstName,
            actorLastName: actor.lastName,
        })
        .from(reportStatusHistoryTable)
        .leftJoin(actor, eq(reportStatusHistoryTable.changedByUserId, actor.id))
        .where(eq(reportStatusHistoryTable.reportId, reportId))
        .orderBy(desc(reportStatusHistoryTable.createdAt))
        .limit(limit);

    return rows.map((row) => ({
        id: row.id,
        oldStatus: row.oldStatus,
        newStatus: row.newStatus,
        reason: row.reason,
        createdAt: row.createdAt,
        changedBy: row.actorId
            ? {
                  id: row.actorId,
                  firstName: row.actorFirstName,
                  lastName: row.actorLastName,
              }
            : null,
    }));
};

const findReportForAdminUpdate = async (
    executor: Executor,
    id: string
): Promise<{ reportStatus: ReportStatus } | null> => {
    const [row] = await executor
        .select({ reportStatus: reportsTable.reportStatus })
        .from(reportsTable)
        .where(and(eq(reportsTable.id, id), isNull(reportsTable.deletedAt)))
        .limit(1);
    return row ?? null;
};

const updateReportStatusById = async (
    executor: Executor,
    id: string,
    status: ReportStatus,
    resolutionReason: string | null
): Promise<{ id: string } | null> => {
    const [updated] = await executor
        .update(reportsTable)
        .set({ reportStatus: status, resolutionReason })
        .where(and(eq(reportsTable.id, id), isNull(reportsTable.deletedAt)))
        .returning({ id: reportsTable.id });
    return updated ?? null;
};

const insertReportStatusHistoryRow = async (
    executor: Executor,
    values: {
        reportId: string;
        oldStatus: ReportStatus | null;
        newStatus: ReportStatus;
        changedByUserId: string;
        reason: string | null;
    }
): Promise<void> => {
    await executor.insert(reportStatusHistoryTable).values(values);
};

const findConversationIdForReport = async (
    executor: Executor,
    reportId: string
): Promise<{ conversationId: string } | null> => {
    const [row] = await executor
        .select({ conversationId: conversationsTable.id })
        .from(reportsTable)
        .innerJoin(
            conversationsTable,
            and(
                eq(conversationsTable.rideId, reportsTable.rideId),
                isNull(conversationsTable.deletedAt)
            )
        )
        .innerJoin(
            bookingsTable,
            eq(conversationsTable.bookingId, bookingsTable.id)
        )
        .innerJoin(ridesTable, eq(bookingsTable.rideId, ridesTable.id))
        .where(
            and(
                eq(reportsTable.id, reportId),
                isNull(reportsTable.deletedAt),
                or(
                    and(
                        eq(bookingsTable.passengerId, reportsTable.reporterId),
                        eq(ridesTable.driverId, reportsTable.targetUserId)
                    ),
                    and(
                        eq(
                            bookingsTable.passengerId,
                            reportsTable.targetUserId
                        ),
                        eq(ridesTable.driverId, reportsTable.reporterId)
                    )
                )
            )
        )
        .limit(1);

    return row ?? null;
};

const findConversationMessagesForReport = async (
    executor: Executor,
    conversationId: string,
    limit: number
): Promise<AdminReportConversationMessage[]> => {
    return await executor
        .select({
            id: messagesTable.id,
            senderId: messagesTable.senderId,
            content: messagesTable.content,
            sentAt: messagesTable.sentAt,
        })
        .from(messagesTable)
        .where(
            and(
                eq(messagesTable.conversationId, conversationId),
                isNull(messagesTable.deletedAt)
            )
        )
        .orderBy(asc(messagesTable.sentAt))
        .limit(limit);
};

export const AdminReportRepository = {
    findReportList,
    findReportCreatedAt,
    findReportDetailById,
    findReportStatusHistoryByReportId,
    findConversationIdForReport,
    findConversationMessagesForReport,
    findReportForAdminUpdate,
    updateReportStatusById,
    insertReportStatusHistoryRow,
};
