import { describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import {
    reports as reportsTable,
    reportStatusHistory,
    users as usersTable,
} from "../../../db/schema";
import { AdminReportService } from "./admin-report.service";
import { ReportService } from "../report.service";
import { ReportErrorCodes } from "../report.errors";
import { ChatService } from "../../chat/chat.service";
import { createRideContext } from "../../../../test/factories";

// Avoid the real OSRM network call during ride creation — keeps ride setup fast
// and deterministic (and off the shared DB pool long enough to race resets).
vi.mock("../../rides/eta/osrm.service", () => ({
    fetchOsrmRouteCells: vi
        .fn()
        .mockResolvedValue({ cells: [], durations: [3600] }),
}));

async function insertAdmin() {
    const [admin] = await db
        .insert(usersTable)
        .values({
            name: "Admin",
            email: `admin-${crypto.randomUUID()}@example.com`,
            userRole: "ADMIN",
        })
        .returning();
    if (!admin) throw new Error("Failed to insert admin");
    return admin.id;
}

/**
 * Files a report from the ride's driver against its passenger (they share a
 * CONFIRMED booking, which makes them eligible to report each other) and
 * inserts a real admin to act as the moderator (status-history rows carry an
 * FK to users.id, so the actor must exist).
 */
async function fileReport(opts: { withRide?: boolean } = {}) {
    const withRide = opts.withRide ?? true;
    const ctx = await createRideContext({ withPassenger: true });
    const report = await ReportService.submitReport({
        reporterId: ctx.driver.id,
        targetUserId: ctx.passenger!.id,
        rideId: withRide ? ctx.rideId : undefined,
        reportType: "INAPPROPRIATE_BEHAVIOR",
        description: "Test report",
    });
    const adminId = await insertAdmin();
    return { ctx, reportId: report.id, adminId };
}

describe("AdminReportService.setReportStatus — reason requirement", () => {
    it("rejects RESOLVED without a reason", async () => {
        const { reportId, adminId } = await fileReport();

        await expect(
            AdminReportService.setReportStatus({
                actorId: adminId,
                reportId,
                newStatus: "RESOLVED",
            })
        ).rejects.toMatchObject({
            code: ReportErrorCodes.ReportReasonRequired,
        });
    });

    it("rejects DISMISSED with a blank reason", async () => {
        const { reportId, adminId } = await fileReport();

        await expect(
            AdminReportService.setReportStatus({
                actorId: adminId,
                reportId,
                newStatus: "DISMISSED",
                reason: "   ",
            })
        ).rejects.toMatchObject({
            code: ReportErrorCodes.ReportReasonRequired,
        });
    });
});

describe("AdminReportService.setReportStatus — transitions", () => {
    it("moves OPEN → INVESTIGATING without a reason", async () => {
        const { reportId, adminId } = await fileReport();

        const result = await AdminReportService.setReportStatus({
            actorId: adminId,
            reportId,
            newStatus: "INVESTIGATING",
        });

        expect(result.report.reportStatus).toBe("INVESTIGATING");
        const history = await db
            .select()
            .from(reportStatusHistory)
            .where(eq(reportStatusHistory.reportId, reportId));
        expect(history.some((h) => h.newStatus === "INVESTIGATING")).toBe(true);
    });

    it("moves OPEN → RESOLVED with a reason and stores it as resolutionReason", async () => {
        const { reportId, adminId } = await fileReport();

        await AdminReportService.setReportStatus({
            actorId: adminId,
            reportId,
            newStatus: "RESOLVED",
            reason: "  handled offline  ",
        });

        const [row] = await db
            .select({
                status: reportsTable.reportStatus,
                resolutionReason: reportsTable.resolutionReason,
            })
            .from(reportsTable)
            .where(eq(reportsTable.id, reportId));
        expect(row?.status).toBe("RESOLVED");
        // Stored trimmed.
        expect(row?.resolutionReason).toBe("handled offline");
    });

    it("rejects an illegal transition out of a terminal status", async () => {
        const { reportId, adminId } = await fileReport();
        await AdminReportService.setReportStatus({
            actorId: adminId,
            reportId,
            newStatus: "RESOLVED",
            reason: "done",
        });

        // RESOLVED is terminal — nothing is allowed out of it.
        await expect(
            AdminReportService.setReportStatus({
                actorId: adminId,
                reportId,
                newStatus: "INVESTIGATING",
            })
        ).rejects.toMatchObject({
            code: ReportErrorCodes.ReportInvalidTransition,
        });
    });

    it("is a no-op when the status is unchanged (no extra history row)", async () => {
        const { reportId, adminId } = await fileReport();

        const result = await AdminReportService.setReportStatus({
            actorId: adminId,
            reportId,
            newStatus: "OPEN",
        });

        expect(result.report.reportStatus).toBe("OPEN");
        const history = await db
            .select()
            .from(reportStatusHistory)
            .where(eq(reportStatusHistory.reportId, reportId));
        // Only the initial OPEN row from submitReport — no second entry.
        expect(history).toHaveLength(1);
    });

    it("throws ReportNotFound for an unknown report", async () => {
        const adminId = await insertAdmin();
        await expect(
            AdminReportService.setReportStatus({
                actorId: adminId,
                reportId: crypto.randomUUID(),
                newStatus: "INVESTIGATING",
            })
        ).rejects.toMatchObject({ code: ReportErrorCodes.ReportNotFound });
    });
});

describe("AdminReportService.getReportConversation", () => {
    it("throws ReportNotFound for an unknown report", async () => {
        const adminId = await insertAdmin();
        await expect(
            AdminReportService.getReportConversation(
                crypto.randomUUID(),
                adminId
            )
        ).rejects.toMatchObject({ code: ReportErrorCodes.ReportNotFound });
    });

    it("returns available:false when the report has no ride", async () => {
        const { reportId, adminId } = await fileReport({ withRide: false });

        const result = await AdminReportService.getReportConversation(
            reportId,
            adminId
        );
        expect(result.available).toBe(false);
        expect(result.conversationId).toBeNull();
        expect(result.messages).toEqual([]);
    });

    it("returns available:false when no conversation has been opened", async () => {
        const { reportId, adminId } = await fileReport();

        const result = await AdminReportService.getReportConversation(
            reportId,
            adminId
        );
        expect(result.available).toBe(false);
        expect(result.conversationId).toBeNull();
    });

    it("returns available:true with participants and messages when a conversation exists", async () => {
        const { ctx, reportId, adminId } = await fileReport();

        const conversationId = await ChatService.getOrCreateConversation(
            ctx.bookingId!,
            ctx.driver.id
        );
        await ChatService.sendMessage(
            conversationId,
            ctx.driver.id,
            "moderation please"
        );

        const result = await AdminReportService.getReportConversation(
            reportId,
            adminId
        );

        expect(result.available).toBe(true);
        expect(result.conversationId).toBe(conversationId);
        expect(result.participants).toHaveLength(2);
        expect(result.messages.map((m) => m.content)).toContain(
            "moderation please"
        );
    });
});

describe("AdminReportService.getReportDetail", () => {
    it("throws ReportNotFound for an unknown report", async () => {
        await expect(
            AdminReportService.getReportDetail(crypto.randomUUID())
        ).rejects.toMatchObject({ code: ReportErrorCodes.ReportNotFound });
    });

    it("returns the report with its OPEN status history", async () => {
        const { reportId } = await fileReport();

        const detail = await AdminReportService.getReportDetail(reportId);
        expect(detail.report.id).toBe(reportId);
        expect(detail.statusHistory.some((h) => h.newStatus === "OPEN")).toBe(
            true
        );
    });
});
