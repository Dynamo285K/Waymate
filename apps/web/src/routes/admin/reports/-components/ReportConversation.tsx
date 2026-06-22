import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@waymate/ui";
import { useGetReportsAdminByIdConversation } from "../../../../api-client/reports/reports";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminReportsErrorMap } from "../-lib/admin-report-errors";
import { formatDate } from "../../../../features/admin/lib/admin-format";

type ReportConversationProps = {
    reportId: string;
    // Maps a message's senderId to a display name (reporter / target).
    nameFor: (senderId: string) => string;
};

const labelClass =
    "text-xs font-bold text-text-secondary tracking-wider mb-1 block";

// Read-only chat between a report's two parties, loaded on demand (admins
// shouldn't pull private messages unless they explicitly open them — the access
// is audit-logged server-side).
export function ReportConversation({
    reportId,
    nameFor,
}: ReportConversationProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const query = useGetReportsAdminByIdConversation(reportId, {
        query: { enabled: open },
    });

    const data = query.data;
    const hasMessages =
        Boolean(data?.available) && (data?.messages.length ?? 0) > 0;

    return (
        <div className="mb-6">
            <p className={labelClass}>{t("admin.reports.conversation")}</p>

            {!open ? (
                <Button
                    variant="secondary"
                    onClick={() => setOpen(true)}
                >
                    {t("admin.reports.viewConversation")}
                </Button>
            ) : query.isLoading ? (
                <p className="text-sm text-text-secondary">
                    {t("admin.reports.conversationLoading")}
                </p>
            ) : query.isError ? (
                <p className="text-sm text-danger-text">
                    {t(getErrorI18nKey(query.error, adminReportsErrorMap))}
                </p>
            ) : !hasMessages ? (
                <p className="text-sm text-text-secondary">
                    {t("admin.reports.noConversation")}
                </p>
            ) : (
                <div className="flex flex-col gap-3 border border-border rounded-xl p-3 bg-background max-h-80 overflow-y-auto">
                    {data!.messages.map((m) => (
                        <div
                            key={m.id}
                            className="flex flex-col"
                        >
                            <span className="text-xs font-semibold text-text-primary">
                                {nameFor(m.senderId)}
                                <span className="font-normal text-text-secondary">
                                    {" · "}
                                    {formatDate(m.sentAt, "—")}
                                </span>
                            </span>
                            <span className="text-sm text-text-primary whitespace-pre-wrap">
                                {m.content}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
