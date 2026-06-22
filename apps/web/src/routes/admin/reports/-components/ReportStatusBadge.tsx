import type { ReportStatus } from "../../../../api-client/model/reportStatus";
import {
    REPORT_STATUS_BADGE_CLASSES,
    useReportStatusLabels,
} from "../-lib/admin-report-labels";

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
    const labels = useReportStatusLabels();
    return (
        <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${REPORT_STATUS_BADGE_CLASSES[status]}`}
        >
            {labels[status]}
        </span>
    );
}
