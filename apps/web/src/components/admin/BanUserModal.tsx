import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Modal, Textarea } from "@waymate/ui";
import { getErrorI18nKey } from "../../lib/api-errors";
import { adminUsersErrorMap } from "../../lib/admin-errors";

type BanUserModalProps = {
    userName: string;
    isPending: boolean;
    error: unknown;
    onClose: () => void;
    onConfirm: (reason: string | undefined) => void;
};

export function BanUserModal({
    userName,
    isPending,
    error,
    onClose,
    onConfirm,
}: BanUserModalProps) {
    const { t } = useTranslation();
    const [reason, setReason] = useState("");

    const trimmedReason = reason.trim();

    return (
        <Modal
            open={true}
            onClose={onClose}
        >
            <div className="w-[calc(100vw-2rem)] max-w-lg p-8">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.banUser")} — {userName}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<span aria-hidden>✕</span>}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                <div className="bg-(--color-danger-bg) border border-(--color-danger-border) rounded-xl p-4 mb-5 text-sm text-(--color-danger-text)">
                    {t("admin.banWarning")}
                </div>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-(--color-text-primary) mb-1.5 block">
                        {t("admin.reasonForBan")}
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
                        {t(getErrorI18nKey(error, adminUsersErrorMap))}
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
                        onClick={() =>
                            onConfirm(
                                trimmedReason.length > 0
                                    ? trimmedReason
                                    : undefined
                            )
                        }
                        disabled={isPending}
                    >
                        ⊘ {t("admin.confirmBan")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
