import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Modal, Textarea } from "@waymate/ui";
import type { ReviewStatus } from "../../api-client/model/reviewStatus";
import { getErrorI18nKey } from "../../lib/api-errors";
import { adminReviewsErrorMap } from "../../lib/admin-review-errors";
import { useReviewStatusLabels } from "../../lib/admin-review-labels";

type SetReviewStatusModalProps = {
    targetStatus: ReviewStatus;
    isPending: boolean;
    error: unknown;
    onClose: () => void;
    onConfirm: (reason: string) => void;
};

export function SetReviewStatusModal({
    targetStatus,
    isPending,
    error,
    onClose,
    onConfirm,
}: SetReviewStatusModalProps) {
    const { t } = useTranslation();
    const labels = useReviewStatusLabels();
    const [reason, setReason] = useState("");

    const trimmedReason = reason.trim();
    const canConfirm = trimmedReason.length > 0 && !isPending;

    const variant = targetStatus === "VISIBLE" ? "primary" : "red";

    return (
        <Modal
            open={true}
            onClose={onClose}
        >
            <div className="w-[calc(100vw-2rem)] max-w-lg p-8">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.setReviewStatus", {
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

                {targetStatus !== "VISIBLE" && (
                    <div className="bg-(--color-warning-bg) border border-(--color-border) rounded-xl p-4 mb-5 text-sm text-(--color-text-primary)">
                        {targetStatus === "HIDDEN"
                            ? t("admin.hideReviewWarning")
                            : t("admin.removeReviewWarning")}
                    </div>
                )}

                <div className="mb-6">
                    <label className="text-sm font-semibold text-(--color-text-primary) mb-1.5 block">
                        {t("admin.reasonForModeration")}{" "}
                        <span className="text-(--color-danger-text)">*</span>
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
                        {t(getErrorI18nKey(error, adminReviewsErrorMap))}
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
                        onClick={() => onConfirm(trimmedReason)}
                        disabled={!canConfirm}
                    >
                        {t("admin.confirm")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
