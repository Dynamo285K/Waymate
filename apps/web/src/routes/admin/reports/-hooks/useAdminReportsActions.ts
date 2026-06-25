import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSetReportStatus } from "./useSetReportStatus";
import { useSetUserStatus } from "../../users/-hooks/useSetUserStatus";
import {
    getGetReportsAdminQueryKey,
    getGetReportsAdminByIdQueryKey,
} from "../../../../api-client/reports/reports";
import type { ReportStatus } from "../../../../api-client/model/reportStatus";
import { getErrorCode } from "../../../../lib/api-errors";
import { ADMIN_REPORT_NOT_FOUND_CODE } from "../-lib/admin-report-errors";

type BanTarget = { id: string; name: string };

// Owns the detail / status-confirm / ban modal orchestration for the
// admin-reports page so the route file stays a lean orchestrator. A report
// review can both transition the report's status and ban a party, so this hook
// drives two mutations (report status + user status).
export function useAdminReportsActions() {
    const queryClient = useQueryClient();

    const [selectedReportId, setSelectedReportId] = useState<string | null>(
        null
    );
    const [pendingStatus, setPendingStatus] = useState<ReportStatus | null>(
        null
    );
    const [banTarget, setBanTarget] = useState<BanTarget | null>(null);

    const setReportStatus = useSetReportStatus();
    const setUserStatus = useSetUserStatus();

    const rowMutatingId = setReportStatus.isPending
        ? (setReportStatus.variables?.id ?? null)
        : null;

    const errorTargetForStatus = setReportStatus.isError
        ? (setReportStatus.variables?.id ?? null)
        : null;

    // Surfaced both inside the detail modal and the status-confirm modal.
    const statusError =
        selectedReportId && errorTargetForStatus === selectedReportId
            ? setReportStatus.error
            : null;

    const detailIsMutating =
        selectedReportId !== null && rowMutatingId === selectedReportId;

    const banModalError = setUserStatus.isError ? setUserStatus.error : null;

    const handleMutationFailure = useCallback(
        (error: unknown) => {
            if (getErrorCode(error) === ADMIN_REPORT_NOT_FOUND_CODE) {
                void queryClient.invalidateQueries({
                    queryKey: getGetReportsAdminQueryKey(),
                });
                setSelectedReportId(null);
                setPendingStatus(null);
            }
        },
        [queryClient]
    );

    const handleConfirmStatus = (reason: string | undefined) => {
        if (!selectedReportId || !pendingStatus) return;
        setReportStatus.mutate(
            {
                reportId: selectedReportId,
                status: pendingStatus,
                reason,
            },
            {
                onSuccess: () => setPendingStatus(null),
                onError: handleMutationFailure,
            }
        );
    };

    const handleConfirmBan = (reason: string | undefined) => {
        if (!banTarget) return;
        const reportId = selectedReportId;
        setUserStatus.mutate(
            { userId: banTarget.id, status: "BANNED", reason },
            {
                onSuccess: () => {
                    setBanTarget(null);
                    // Refresh the detail so the target shows as banned and the
                    // ban button is replaced by the "already banned" note.
                    if (reportId) {
                        void queryClient.invalidateQueries({
                            queryKey: getGetReportsAdminByIdQueryKey(reportId),
                        });
                    }
                },
            }
        );
    };

    const openDetail = (id: string | null) => {
        setReportStatus.reset();
        setUserStatus.reset();
        setPendingStatus(null);
        setBanTarget(null);
        setSelectedReportId(id);
    };

    const requestBan = (target: BanTarget) => {
        setUserStatus.reset();
        setBanTarget(target);
    };

    return {
        rowMutatingId,
        // detail modal
        selectedReportId,
        detailIsMutating,
        detailError: statusError,
        openDetail,
        requestStatus: setPendingStatus,
        requestBan,
        // status-confirm modal
        pendingStatus,
        statusModalIsPending: rowMutatingId === selectedReportId,
        statusModalError: statusError,
        handleConfirmStatus,
        closeStatusModal: () => setPendingStatus(null),
        // ban modal
        banTarget,
        banModalIsPending: setUserStatus.isPending,
        banModalError,
        handleConfirmBan,
        closeBanModal: () => setBanTarget(null),
    };
}
