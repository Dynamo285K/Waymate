import { and, eq, inArray, isNull, or } from "drizzle-orm";
import type { Executor } from "../../db";
import { reports as reportsTable } from "../../db/schema/report";
import { reportStatusHistory as reportStatusHistoryTable } from "../../db/schema/report_status_history";
import { rides as ridesTable } from "../../db/schema/ride";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { users as usersTable } from "../../db/schema/user";
import type { CreateReportInput, Report } from "./report.types";

const findUserById = async (
    executor: Executor,
    userId: string
): Promise<{ id: string; userRole: string } | null> => {
    const [row] = await executor
        .select({ id: usersTable.id, userRole: usersTable.userRole })
        .from(usersTable)
        .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))
        .limit(1);

    return row ?? null;
};

const findVisibleRideById = async (
    executor: Executor,
    rideId: string
): Promise<{ id: string } | null> => {
    const [row] = await executor
        .select({ id: ridesTable.id })
        .from(ridesTable)
        .where(and(eq(ridesTable.id, rideId), isNull(ridesTable.deletedAt)))
        .limit(1);

    return row ?? null;
};

// Eligibility check: returns true iff `reporterId` and `targetUserId` have
// participated in at least one non-deleted ride as driver↔passenger, in either
// direction. The booking must be in a state where the pair was actually
// matched (CONFIRMED / COMPLETED / NO_SHOW) — PENDING / REJECTED / CANCELLED
// don't count.
const findSharedRideExists = async (
    executor: Executor,
    reporterId: string,
    targetUserId: string
): Promise<boolean> => {
    const activeBookingStatuses = [
        "CONFIRMED",
        "COMPLETED",
        "NO_SHOW",
    ] as const;

    const [row] = await executor
        .select({ rideId: ridesTable.id })
        .from(ridesTable)
        .innerJoin(bookingsTable, eq(bookingsTable.rideId, ridesTable.id))
        .where(
            and(
                isNull(ridesTable.deletedAt),
                isNull(bookingsTable.deletedAt),
                inArray(bookingsTable.bookingStatus, activeBookingStatuses),
                or(
                    and(
                        eq(ridesTable.driverId, reporterId),
                        eq(bookingsTable.passengerId, targetUserId)
                    ),
                    and(
                        eq(ridesTable.driverId, targetUserId),
                        eq(bookingsTable.passengerId, reporterId)
                    )
                )
            )
        )
        .limit(1);

    return Boolean(row);
};

const insertReport = async (
    executor: Executor,
    input: CreateReportInput
): Promise<Report> => {
    const [row] = await executor
        .insert(reportsTable)
        .values({
            reporterId: input.reporterId,
            targetUserId: input.targetUserId,
            rideId: input.rideId ?? null,
            reportType: input.reportType,
            description: input.description,
            reportStatus: "OPEN",
        })
        .returning();

    return row as Report;
};

type ReportStatusHistoryInsert = {
    reportId: string;
    oldStatus: Report["reportStatus"] | null;
    newStatus: Report["reportStatus"];
    changedByUserId: string;
    reason: string | null;
};

const insertReportStatusHistory = async (
    executor: Executor,
    input: ReportStatusHistoryInsert
): Promise<void> => {
    await executor.insert(reportStatusHistoryTable).values({
        reportId: input.reportId,
        oldStatus: input.oldStatus,
        newStatus: input.newStatus,
        changedByUserId: input.changedByUserId,
        reason: input.reason,
    });
};

// Is there already an unresolved (OPEN / INVESTIGATING) report from this
// reporter against this target for the same ride context? Used to stop
// duplicate / spam reports while one is still being handled.
const findOpenReportExists = async (
    executor: Executor,
    reporterId: string,
    targetUserId: string,
    rideId: string | undefined
): Promise<boolean> => {
    const [row] = await executor
        .select({ id: reportsTable.id })
        .from(reportsTable)
        .where(
            and(
                isNull(reportsTable.deletedAt),
                eq(reportsTable.reporterId, reporterId),
                eq(reportsTable.targetUserId, targetUserId),
                rideId
                    ? eq(reportsTable.rideId, rideId)
                    : isNull(reportsTable.rideId),
                inArray(reportsTable.reportStatus, ["OPEN", "INVESTIGATING"])
            )
        )
        .limit(1);

    return row !== undefined;
};

export const ReportRepository = {
    findUserById,
    findVisibleRideById,
    findSharedRideExists,
    findOpenReportExists,
    insertReport,
    insertReportStatusHistory,
};
