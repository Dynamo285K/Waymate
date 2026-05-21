import { useTranslation } from "react-i18next";
import { Modal, Button } from "@waymate/ui";
import { useLayout } from "../lib/use-layout";

type CompleteRideDialogProps = {
    open: boolean;
    loading?: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

export function CompleteRideDialog({
    open,
    loading,
    onOpenChange,
    onConfirm,
}: CompleteRideDialogProps) {
    const { t } = useTranslation();
    const { theme } = useLayout();

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            theme={theme}
        >
            <div className="p-6">
                <h2 className="text-xl font-bold text-(--color-text-primary) mb-2">
                    {t("completeRideDialog.title")}
                </h2>
                <p className="text-sm text-(--color-text-secondary) mb-6 leading-relaxed">
                    {t("completeRideDialog.message")}
                </p>
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        disabled={loading}
                        onClick={() => onOpenChange(false)}
                    >
                        {t("completeRideDialog.cancel")}
                    </Button>
                    <Button
                        variant="primary"
                        disabled={loading}
                        onClick={onConfirm}
                    >
                        {loading
                            ? t("driverRides.completing")
                            : t("completeRideDialog.confirm")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
