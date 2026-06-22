import { useTranslation } from "react-i18next";
import { Button, Modal } from "@waymate/ui";

type BlockConfirmModalProps = {
    open: boolean;
    theme: "light" | "dark";
    counterpartName: string;
    isBlocking: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export function BlockConfirmModal({
    open,
    theme,
    counterpartName,
    isBlocking,
    onConfirm,
    onClose,
}: BlockConfirmModalProps) {
    const { t } = useTranslation();

    return (
        <Modal
            open={open}
            onClose={onClose}
            theme={theme}
        >
            <div className="w-modal-viewport max-w-md p-6">
                <h2 className="text-lg font-bold text-text-primary mb-2">
                    {t("chat.blockConfirmTitle", { name: counterpartName })}
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                    {t("chat.blockConfirmText")}
                </p>
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isBlocking}
                    >
                        {t("chat.cancel")}
                    </Button>
                    <Button
                        variant="red"
                        onClick={onConfirm}
                        disabled={isBlocking}
                    >
                        {t("chat.blockUser")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
