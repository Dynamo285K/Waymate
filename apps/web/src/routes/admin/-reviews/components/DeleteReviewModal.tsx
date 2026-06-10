import { useTranslation } from "react-i18next";
import { Button, Modal } from "@waymate/ui";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminReviewsErrorMap } from "../lib/admin-review-errors";

type DeleteReviewModalProps = {
    theme: "light" | "dark";
    isPending: boolean;
    error: unknown;
    onClose: () => void;
    onConfirm: () => void;
};

export function DeleteReviewModal({
    theme,
    isPending,
    error,
    onClose,
    onConfirm,
}: DeleteReviewModalProps) {
    const { t } = useTranslation();

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <div className="p-6">
                <h2 className="text-xl font-bold text-(--color-text-primary) mb-2">
                    {t("admin.deleteReviewTitle")}
                </h2>
                <p className="text-sm text-(--color-text-secondary) mb-6 leading-relaxed">
                    {t("admin.deleteReviewMessage")}
                </p>

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
                        variant="unstyled"
                        disabled={isPending}
                        className="px-4 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer disabled:opacity-50"
                        style={{ background: "var(--color-red)" }}
                        onClick={onConfirm}
                    >
                        {t("admin.deleteReviewConfirm")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
