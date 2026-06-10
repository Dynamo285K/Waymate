import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Modal, Textarea } from "@waymate/ui";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminRidesErrorMap } from "../lib/admin-ride-errors";

type CancelRideModalProps = {
    theme: "light" | "dark";
    rideRoute: string;
    isPending: boolean;
    error: unknown;
    onClose: () => void;
    onConfirm: (reason: string) => void;
};

export function CancelRideModal({
    theme,
    rideRoute,
    isPending,
    error,
    onClose,
    onConfirm,
}: CancelRideModalProps) {
    const { t } = useTranslation();
    const [reason, setReason] = useState("");

    const trimmedReason = reason.trim();
    const canConfirm = trimmedReason.length > 0 && !isPending;

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <div className="w-[calc(100vw-2rem)] max-w-lg p-8">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.forceCancelRide")} — {rideRoute}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<span aria-hidden>✕</span>}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                <div className="bg-(--color-danger-bg) border border-(--color-danger-border) rounded-xl p-4 mb-5 text-sm text-(--color-danger-text)">
                    {t("admin.cancelRideWarning")}
                </div>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-(--color-text-primary) mb-1.5 block">
                        {t("admin.reasonForCancel")}{" "}
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
                        {t(getErrorI18nKey(error, adminRidesErrorMap))}
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
                        onClick={() => onConfirm(trimmedReason)}
                        disabled={!canConfirm}
                    >
                        ⊘ {t("admin.confirmCancel")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
