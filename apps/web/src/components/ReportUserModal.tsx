import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Modal, Textarea } from "@waymate/ui";
import { usePostReports } from "../api-client/reports/reports";
import { getGetAdminReportsQueryKey } from "../api-client/admin/admin";
import { ReportType } from "../api-client/model/reportType";
import type { CreateReportBody } from "../api-client/model/createReportBody";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorI18nKey } from "../lib/api-errors";
import { reportUserErrorMap } from "../lib/report-errors";

const REPORT_TYPE_OPTIONS: ReadonlyArray<{
    value: ReportType;
    labelKey: string;
}> = [
    {
        value: ReportType.INAPPROPRIATE_BEHAVIOR,
        labelKey: "report.types.inappropriateBehavior",
    },
    { value: ReportType.NO_SHOW, labelKey: "report.types.noShow" },
    {
        value: ReportType.OVERCHARGING,
        labelKey: "report.types.overcharging",
    },
    {
        value: ReportType.LEFT_LUGGAGE,
        labelKey: "report.types.leftLuggage",
    },
    {
        value: ReportType.SAFETY_ISSUE,
        labelKey: "report.types.safetyIssue",
    },
    { value: ReportType.OTHER, labelKey: "report.types.other" },
];

type ReportUserModalProps = {
    targetUserId: string;
    targetName: string;
    rideId?: string;
    onClose: () => void;
    onSuccess?: () => void;
};

export function ReportUserModal({
    targetUserId,
    targetName,
    rideId,
    onClose,
    onSuccess,
}: ReportUserModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [reportType, setReportType] = useState<ReportType>(
        ReportType.INAPPROPRIATE_BEHAVIOR
    );
    const [description, setDescription] = useState("");

    const mutation = usePostReports({
        mutation: {
            onSuccess: async () => {
                await queryClient.invalidateQueries({
                    queryKey: getGetAdminReportsQueryKey(),
                });
                onSuccess?.();
                onClose();
            },
        },
    });

    const trimmedDescription = description.trim();
    const canSubmit = trimmedDescription.length > 0 && !mutation.isPending;

    const handleSubmit = () => {
        if (!canSubmit) return;
        const body: CreateReportBody = {
            targetUserId,
            reportType,
            description: trimmedDescription,
            ...(rideId ? { rideId } : {}),
        };
        mutation.mutate({ data: body });
    };

    return (
        <Modal
            open={true}
            onClose={onClose}
        >
            <div className="w-[calc(100vw-2rem)] max-w-lg p-8">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("report.title")} — {targetName}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<span aria-hidden>✕</span>}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                <p className="text-sm text-(--color-text-secondary) mb-5">
                    {t("report.intro")}
                </p>

                <div className="mb-5">
                    <label className="text-sm font-semibold text-(--color-text-primary) mb-1.5 block">
                        {t("report.typeLabel")}{" "}
                        <span className="text-(--color-danger-text)">*</span>
                    </label>
                    <select
                        value={reportType}
                        onChange={(e) =>
                            setReportType(e.target.value as ReportType)
                        }
                        className="w-full rounded-xl border border-(--color-border) bg-(--color-card) px-4 py-3 text-sm text-(--color-text-primary) focus:outline-none focus:border-(--color-primary)"
                    >
                        {REPORT_TYPE_OPTIONS.map((opt) => (
                            <option
                                key={opt.value}
                                value={opt.value}
                            >
                                {t(opt.labelKey)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-(--color-text-primary) mb-1.5 block">
                        {t("report.descriptionLabel")}{" "}
                        <span className="text-(--color-danger-text)">*</span>
                    </label>
                    <Textarea
                        placeholder={t("report.descriptionPlaceholder")}
                        maxLength={2000}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {mutation.isError && (
                    <p className="text-sm text-(--color-danger-text) mb-4">
                        {t(getErrorI18nKey(mutation.error, reportUserErrorMap))}
                    </p>
                )}

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={mutation.isPending}
                    >
                        {t("report.cancel")}
                    </Button>
                    <Button
                        variant="red"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {t("report.submit")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
