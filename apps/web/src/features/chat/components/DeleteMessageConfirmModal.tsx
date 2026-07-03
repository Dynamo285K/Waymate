import { useTranslation } from "react-i18next";
import { Button, Modal } from "@waymate/ui";

type DeleteMessageConfirmModalProps = {
    open: boolean;
    theme: "light" | "dark";
    onConfirm: () => void;
    onClose: () => void;
};

export function DeleteMessageConfirmModal({
    open,
    theme,
    onConfirm,
    onClose,
}: DeleteMessageConfirmModalProps) {
    const { t } = useTranslation();

    return (
        <Modal
            open={open}
            onClose={onClose}
            theme={theme}
        >
            <div className="w-full min-w-0 max-w-md p-5 sm:p-6">
                <h2 className="text-lg font-bold text-text-primary mb-2">
                    {t("chat.deleteConfirmTitle")}
                </h2>
                <p className="text-sm text-text-secondary mb-6 break-words">
                    {t("chat.deleteConfirmText")}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                        variant="secondary"
                        className="justify-center"
                        onClick={onClose}
                    >
                        {t("chat.cancel")}
                    </Button>
                    <Button
                        variant="red"
                        className="justify-center"
                        onClick={onConfirm}
                    >
                        {t("chat.deleteAction")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
