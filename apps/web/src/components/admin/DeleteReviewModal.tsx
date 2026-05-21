import { useTranslation } from "react-i18next";
import { Button, IconButton, Modal } from "@waymate/ui";
import { getErrorI18nKey } from "../../lib/api-errors";
import { adminReviewsErrorMap } from "../../lib/admin-review-errors";

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
            <div className="w-[calc(100vw-2rem)] max-w-lg p-8">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.deleteReviewTitle")}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<span aria-hidden>✕</span>}
                        variant="ghost"
                        onClick={onClose}
                        disabled={isPending}
                    />
                </div>

                <div className="bg-(--color-danger-bg) border border-(--color-danger-border) rounded-xl p-4 mb-6 text-sm text-(--color-danger-text)">
                    {t("admin.deleteReviewWarning")}
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
                        variant="red"
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {t("admin.deletePermanently")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
