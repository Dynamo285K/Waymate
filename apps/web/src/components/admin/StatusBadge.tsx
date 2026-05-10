import type { UserStatus } from "../../api-client/model/userStatus";
import { STATUS_BADGE_CLASSES, useStatusLabels } from "../../lib/admin-labels";

export function StatusBadge({ status }: { status: UserStatus }) {
    const labels = useStatusLabels();
    return (
        <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE_CLASSES[status]}`}
        >
            {labels[status]}
        </span>
    );
}
