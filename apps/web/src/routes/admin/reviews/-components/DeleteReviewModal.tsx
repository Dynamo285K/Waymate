import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminReviewsErrorMap } from "../-lib/admin-review-errors";
import {
    AdminModalActions,
    AdminModalBody,
    AdminModalHeader,
    adminActionButtonClass,
} from "../../-components/AdminModalLayout";

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
            <AdminModalBody>
                <AdminModalHeader
                    title={t("admin.deleteReviewTitle")}
                    onClose={onClose}
                />

                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                    {t("admin.deleteReviewMessage")}
                </p>

                {error !== null && error !== undefined && (
                    <p className="text-sm text-danger-text mb-4">
                        {t(getErrorI18nKey(error, adminReviewsErrorMap))}
                    </p>
                )}

                <AdminModalActions>
                    <Button
                        variant="secondary"
                        className={adminActionButtonClass}
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {t("admin.cancel")}
                    </Button>
                    <Button
                        variant="red"
                        leftIcon={<TrashIcon />}
                        className={adminActionButtonClass}
                        disabled={isPending}
                        onClick={onConfirm}
                    >
                        {t("admin.deleteReviewConfirm")}
                    </Button>
                </AdminModalActions>
            </AdminModalBody>
        </Modal>
    );
}
