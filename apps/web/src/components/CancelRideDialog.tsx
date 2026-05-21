import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Button, Textarea } from "@waymate/ui";
import { useLayout } from "../lib/use-layout";

export type CancelRideDialogProps = {
    open: boolean;
    loading?: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    title?: string;
    message?: string;
};

export function CancelRideDialog({
    open,
    loading,
    onOpenChange,
    onConfirm,
    title,
    message,
}: CancelRideDialogProps) {
    const { t } = useTranslation();
    const { theme } = useLayout();
    const [reason, setReason] = useState("");

    // Clear the reason when the dialog transitions to closed. Adjusting state
    // during render (tracking the previous `open`) avoids a setState-in-effect
    // cascade — the React-recommended pattern for resetting on prop change.
    const [prevOpen, setPrevOpen] = useState(open);
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (!open) setReason("");
    }

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            theme={theme}
        >
            <h2 className="text-xl font-bold text-(--color-text-primary) mb-2">
                {title ?? t("cancelRideDialog.title")}
            </h2>
            <p className="text-sm text-(--color-text-secondary) mb-5 leading-relaxed">
                {message ?? t("cancelRideDialog.message")}
            </p>
            <div className="mb-6">
                <Textarea
                    label={t("cancelRideDialog.reasonLabel")}
                    placeholder={t("cancelRideDialog.reasonPlaceholder")}
                    value={reason}
                    rows={3}
                    maxLength={500}
                    onChange={(e) => setReason(e.target.value)}
                />
            </div>
            <div className="flex gap-3 justify-end">
                <Button
                    variant="secondary"
                    disabled={loading}
                    onClick={() => onOpenChange(false)}
                >
                    {t("cancelRideDialog.goBack")}
                </Button>
                <Button
                    variant="red"
                    disabled={loading}
                    onClick={() => onConfirm(reason.trim())}
                >
                    {t("cancelRideDialog.confirm")}
                </Button>
            </div>
        </Modal>
    );
}
