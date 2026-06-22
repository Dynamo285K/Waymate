import { useTranslation } from "react-i18next";
import { Button, CheckIcon, CloseIcon } from "@waymate/ui";
import type { ReportStatus } from "../../../../api-client/model/reportStatus";

// Workflow: OPEN can go to INVESTIGATING / RESOLVED / DISMISSED.
// INVESTIGATING can go to RESOLVED / DISMISSED. RESOLVED and DISMISSED
// are terminal — the detail UI hides any action that the backend would
// reject so admins can't waste a click.
const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
    OPEN: ["INVESTIGATING", "RESOLVED", "DISMISSED"],
    INVESTIGATING: ["RESOLVED", "DISMISSED"],
    RESOLVED: [],
    DISMISSED: [],
};

type ReportStatusActionsProps = {
    status: ReportStatus;
    isMutating: boolean;
    onRequestStatus: (target: ReportStatus) => void;
};

export function ReportStatusActions({
    status,
    isMutating,
    onRequestStatus,
}: ReportStatusActionsProps) {
    const { t } = useTranslation();
    const allowed = ALLOWED_TRANSITIONS[status];

    if (allowed.length === 0) return null;

    return (
        <div className="flex gap-2 flex-wrap mb-6">
            {allowed.includes("INVESTIGATING") && (
                <Button
                    variant="secondary"
                    onClick={() => onRequestStatus("INVESTIGATING")}
                    disabled={isMutating}
                >
                    {t("admin.reports.markInvestigating")}
                </Button>
            )}
            {allowed.includes("RESOLVED") && (
                <Button
                    variant="primary"
                    leftIcon={<CheckIcon />}
                    onClick={() => onRequestStatus("RESOLVED")}
                    disabled={isMutating}
                >
                    {t("admin.reports.markResolved")}
                </Button>
            )}
            {allowed.includes("DISMISSED") && (
                <Button
                    variant="red"
                    leftIcon={<CloseIcon />}
                    onClick={() => onRequestStatus("DISMISSED")}
                    disabled={isMutating}
                >
                    {t("admin.reports.markDismissed")}
                </Button>
            )}
        </div>
    );
}
