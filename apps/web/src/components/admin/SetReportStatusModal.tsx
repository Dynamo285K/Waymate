import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Modal, Textarea } from "@waymate/ui";
import type { ReportStatus } from "../../api-client/model/reportStatus";
import { getErrorI18nKey } from "../../lib/api-errors";
import { adminReportsErrorMap } from "../../lib/admin-report-errors";
import { useReportStatusLabels } from "../../lib/admin-report-labels";

type SetReportStatusModalProps = {
    targetStatus: ReportStatus;
    isPending: boolean;
    error: unknown;
    onClose: () => void;
    onConfirm: (reason: string | undefined) => void;
};

// RESOLVED and DISMISSED capture a moderation decision and need an
// auditable reason; INVESTIGATING is a workflow signal that the admin is
// looking into it, no narrative required.
const REQUIRES_REASON: ReadonlyArray<ReportStatus> = ["RESOLVED", "DISMISSED"];

export function SetReportStatusModal({
    targetStatus,
    isPending,
    error,
    onClose,
    onConfirm,
}: SetReportStatusModalProps) {
    const { t } = useTranslation();
    const labels = useReportStatusLabels();
    const [reason, setReason] = useState("");

    const reasonRequired = REQUIRES_REASON.includes(targetStatus);
    const trimmedReason = reason.trim();
    const canConfirm =
        (!reasonRequired || trimmedReason.length > 0) && !isPending;

    const variant =
        targetStatus === "RESOLVED"
            ? "primary"
            : targetStatus === "DISMISSED"
              ? "red"
              : "secondary";

    return (
        <Modal
            open={true}
            onClose={onClose}
        >
            <div className="w-[calc(100vw-2rem)] max-w-lg p-8">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.reports.setStatus", {
                            status: labels[targetStatus],
                        })}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<span aria-hidden>✕</span>}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-(--color-text-primary) mb-1.5 block">
                        {t("admin.reports.reasonLabel")}{" "}
                        {reasonRequired && (
                            <span className="text-(--color-danger-text)">
                                *
                            </span>
                        )}
                    </label>
                    <Textarea
                        placeholder={t("admin.reasonPlaceholder")}
                        maxLength={500}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                {error !== null && error !== undefined && (
                    <p className="text-sm text-(--color-danger-text) mb-4">
                        {t(getErrorI18nKey(error, adminReportsErrorMap))}
                    </p>
                )}

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {t("admin.cancel")}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={() =>
                            onConfirm(
                                trimmedReason.length > 0
                                    ? trimmedReason
                                    : undefined
                            )
                        }
                        disabled={!canConfirm}
                    >
                        {t("admin.confirm")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
