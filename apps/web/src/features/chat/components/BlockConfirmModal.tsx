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
            <div className="w-full min-w-0 max-w-md p-5 sm:p-6">
                <h2 className="text-lg font-bold text-text-primary mb-2">
                    {t("chat.blockConfirmTitle", { name: counterpartName })}
                </h2>
                <p className="text-sm text-text-secondary mb-6 break-words">
                    {t("chat.blockConfirmText")}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                        variant="secondary"
                        className="justify-center"
                        onClick={onClose}
                        disabled={isBlocking}
                    >
                        {t("chat.cancel")}
                    </Button>
                    <Button
                        variant="red"
                        className="justify-center"
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
