import { db } from "../../db";
import { ReportRepository } from "./report.repository";
import { ReportError, ReportErrorCodes } from "./report.errors";
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

        const report = await ReportRepository.insertReport(tx, input);

        await ReportRepository.insertReportStatusHistory(tx, {
            reportId: report.id,
            oldStatus: null,
            newStatus: "OPEN",
            changedByUserId: input.reporterId,
            reason: null,
        });

        return report;
    });
};

export const ReportService = {
    submitReport,
};
