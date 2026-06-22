import { useMemo } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button, Modal, Textarea } from "@waymate/ui";
import type { ReportStatus } from "../../../../api-client/model/reportStatus";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminReportsErrorMap } from "../-lib/admin-report-errors";
import { useReportStatusLabels } from "../-lib/admin-report-labels";
import {
    AdminModalActions,
    AdminModalBody,
    AdminModalHeader,
    adminActionButtonClass,
} from "../../-components/AdminModalLayout";

type SetReportStatusModalProps = {
    theme: "light" | "dark";
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
    theme,
    targetStatus,
    isPending,
    error,
    onClose,
    onConfirm,
}: SetReportStatusModalProps) {
    const { t } = useTranslation();
    const labels = useReportStatusLabels();

    const reasonRequired = REQUIRES_REASON.includes(targetStatus);
    const schema = useMemo(
        () =>
            z.object({
                reason: reasonRequired ? z.string().trim().min(1) : z.string(),
            }),
        [reasonRequired]
    );
    type FormValues = z.infer<typeof schema>;

    const {
        control,
        handleSubmit,
        formState: { isValid },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: { reason: "" },
    });

    const onSubmit: SubmitHandler<FormValues> = ({ reason }) => {
        const trimmed = reason.trim();
        onConfirm(trimmed.length > 0 ? trimmed : undefined);
    };

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
            theme={theme}
        >
            <AdminModalBody
                as="form"
                onSubmit={handleSubmit(onSubmit)}
            >
                <AdminModalHeader
                    title={t("admin.reports.setStatus", {
                        status: labels[targetStatus],
                    })}
                    onClose={onClose}
                />

                <div className="mb-6">
                    <label className="text-sm font-semibold text-text-primary mb-1.5 block">
                        {t("admin.reports.reasonLabel")}{" "}
                        {reasonRequired && (
                            <span className="text-danger-text">*</span>
                        )}
                    </label>
                    <Controller
                        control={control}
                        name="reason"
                        render={({ field }) => (
                            <Textarea
                                placeholder={t("admin.reasonPlaceholder")}
                                maxLength={500}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>

                {error !== null && error !== undefined && (
                    <p className="text-sm text-danger-text mb-4">
                        {t(getErrorI18nKey(error, adminReportsErrorMap))}
                    </p>
                )}

                <AdminModalActions>
                    <Button
                        type="button"
                        variant="secondary"
                        className={adminActionButtonClass}
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {t("admin.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant={variant}
                        className={adminActionButtonClass}
                        disabled={!isValid || isPending}
                    >
                        {t("admin.confirm")}
                    </Button>
                </AdminModalActions>
            </AdminModalBody>
        </Modal>
    );
}
