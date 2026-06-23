import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BanIcon, Button, Modal, Textarea } from "@waymate/ui";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminUsersErrorMap } from "../-lib/admin-errors";
import {
    AdminModalActions,
    AdminModalBody,
    AdminModalHeader,
    adminActionButtonClass,
} from "../../-components/AdminModalLayout";

type BanUserModalProps = {
    theme: "light" | "dark";
    userName: string;
    isPending: boolean;
    error: unknown;
    onClose: () => void;
    onConfirm: (reason: string | undefined) => void;
};

// The ban reason is optional, so the form needs no resolver: just a single
// RHF-owned field, kept consistent with the other moderation modals.
type FormValues = { reason: string };

export function BanUserModal({
    theme,
    userName,
    isPending,
    error,
    onClose,
    onConfirm,
}: BanUserModalProps) {
    const { t } = useTranslation();

    const { control, handleSubmit } = useForm<FormValues>({
        defaultValues: { reason: "" },
    });

    const onSubmit: SubmitHandler<FormValues> = ({ reason }) => {
        const trimmed = reason.trim();
        onConfirm(trimmed.length > 0 ? trimmed : undefined);
    };

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <AdminModalBody
                as="form"
                onSubmit={handleSubmit(onSubmit)}
            >
                <AdminModalHeader
                    title={`${t("admin.banUser")} - ${userName}`}
                    onClose={onClose}
                />

                <div className="bg-danger-bg border border-danger-border rounded-xl p-4 mb-5 text-sm text-danger-text">
                    {t("admin.banWarning")}
                </div>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-text-primary mb-1.5 block">
                        {t("admin.reasonForBan")}
                    </label>
                    <Controller
                        control={control}
                        name="reason"
                        render={({ field }) => (
                            <Textarea
                                placeholder={t("admin.reasonPlaceholder")}
                                maxLength={500}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>

                {error !== null && error !== undefined && (
                    <p className="text-sm text-danger-text mb-4">
                        {t(getErrorI18nKey(error, adminUsersErrorMap))}
                    </p>
                )}

                <AdminModalActions>
                    <Button
                        type="button"
                        variant="secondary"
                        className={adminActionButtonClass}
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {t("admin.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="red"
                        leftIcon={<BanIcon />}
                        className={adminActionButtonClass}
                        disabled={isPending}
                    >
                        {t("admin.confirmBan")}
                    </Button>
                </AdminModalActions>
            </AdminModalBody>
        </Modal>
    );
}
