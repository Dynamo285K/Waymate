import { useTranslation } from "react-i18next";
import { Button, Modal } from "@waymate/ui";

export function DeleteCarModal({
    open,
    pending,
    onClose,
    onConfirm,
}: {
    open: boolean;
    pending: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const { t } = useTranslation();

    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <h2 className="text-xl font-bold text-text-primary mb-2">
                {t("profile.deleteCar.title")}
            </h2>
            <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                {t("profile.deleteCar.message")}
            </p>
            <div className="flex gap-3 justify-end">
                <Button
                    variant="secondary"
                    onClick={onClose}
                >
                    {t("profile.deleteCar.cancel")}
                </Button>
                <Button
                    variant="unstyled"
                    disabled={pending}
                    className="px-4 py-3 rounded-xl bg-red font-semibold text-sm text-white cursor-pointer disabled:opacity-50"
                    onClick={onConfirm}
                >
                    {t("profile.deleteCar.confirm")}
                </Button>
            </div>
        </Modal>
    );
}
