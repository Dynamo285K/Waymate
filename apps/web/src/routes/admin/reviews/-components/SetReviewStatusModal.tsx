import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button, Modal, Textarea } from "@waymate/ui";
import type { ReviewStatus } from "../../../../api-client/model/reviewStatus";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminReviewsErrorMap } from "../-lib/admin-review-errors";
import { useReviewStatusLabels } from "../-lib/admin-review-labels";
import {
    AdminModalActions,
    AdminModalBody,
    AdminModalHeader,
    adminActionButtonClass,
} from "../../-components/AdminModalLayout";

type SetReviewStatusModalProps = {
    theme: "light" | "dark";
    targetStatus: ReviewStatus;
    isPending: boolean;
    error: unknown;
    onClose: () => void;
    onConfirm: (reason: string) => void;
};

const schema = z.object({ reason: z.string().trim().min(1) });
type FormValues = z.infer<typeof schema>;

export function SetReviewStatusModal({
    theme,
    targetStatus,
    isPending,
    error,
    onClose,
    onConfirm,
}: SetReviewStatusModalProps) {
    const { t } = useTranslation();
    const labels = useReviewStatusLabels();

    const {
        control,
        handleSubmit,
        formState: { isValid },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: { reason: "" },
    });

    const onSubmit: SubmitHandler<FormValues> = ({ reason }) =>
        onConfirm(reason.trim());

    const variant = targetStatus === "VISIBLE" ? "primary" : "red";

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
                    title={t("admin.setReviewStatus", {
                        status: labels[targetStatus],
                    })}
                    onClose={onClose}
                />

                {targetStatus !== "VISIBLE" && (
                    <div className="bg-warning-bg border border-border rounded-xl p-4 mb-5 text-sm text-text-primary">
                        {targetStatus === "HIDDEN"
                            ? t("admin.hideReviewWarning")
                            : t("admin.removeReviewWarning")}
                    </div>
                )}

                <div className="mb-6">
                    <label className="text-sm font-semibold text-text-primary mb-1.5 block">
                        {t("admin.reasonForModeration")}{" "}
                        <span className="text-danger-text">*</span>
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
                        {t(getErrorI18nKey(error, adminReviewsErrorMap))}
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
