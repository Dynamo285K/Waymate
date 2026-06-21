import { db } from "../../db";
import { ReportRepository } from "./report.repository";
import { ReportError, ReportErrorCodes } from "./report.errors";
import { BlockService } from "../blocks/block.service";
import type { CreateReportInput, Report } from "./report.types";

const submitReport = async (input: CreateReportInput): Promise<Report> => {
    if (input.reporterId === input.targetUserId) {
        throw new ReportError(ReportErrorCodes.SelfReportNotAllowed);
    }

    return await db.transaction(async (tx) => {
        const target = await ReportRepository.findVisibleTargetUserById(
            tx,
            input.targetUserId
        );
        if (!target) {
            throw new ReportError(ReportErrorCodes.TargetUserNotFound);
        }

        if (input.rideId !== undefined) {
            const ride = await ReportRepository.findVisibleRideById(
                tx,
                input.rideId
            );
            if (!ride) {
                throw new ReportError(ReportErrorCodes.RideNotFound);
            }
        }

        const eligible = await ReportRepository.haveSharedRide(
            tx,
            input.reporterId,
            input.targetUserId
        );
        if (!eligible) {
            throw new ReportError(ReportErrorCodes.TargetNotAllowed);
        }

        // One unresolved report per reporter→target→ride. A new report is
        // allowed again once the previous one is resolved/dismissed, or for a
        // different ride.
        const alreadyOpen = await ReportRepository.hasOpenReport(
            tx,
            input.reporterId,
            input.targetUserId,
            input.rideId
        );
        if (alreadyOpen) {
            throw new ReportError(ReportErrorCodes.DuplicateOpenReport);
        }

        const report = await ReportRepository.insertReport(tx, input);

        await ReportRepository.insertReportStatusHistory(tx, {
            reportId: report.id,
            oldStatus: null,
            newStatus: "OPEN",
            changedByUserId: input.reporterId,
            reason: null,
        });

        // "Report & block": add the target to the reporter's block list in the
        // same transaction. Idempotent — re-reporting an already-blocked user
        // just keeps the existing block.
        if (input.blockTarget) {
            await BlockService.blockUser(
                {
                    blockerId: input.reporterId,
                    blockedUserId: input.targetUserId,
                    reason: "OTHER",
                    reasonText: "Blocked while filing a report",
                },
                tx
            );
        }

        return report;
    });
};

export const ReportService = {
    submitReport,
};
