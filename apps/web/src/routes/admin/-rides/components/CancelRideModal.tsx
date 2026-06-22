import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const schema = z.object({ reason: z.string().trim().min(1) });
type FormValues = z.infer<typeof schema>;

export function CancelRideModal({
    theme,
    rideRoute,
    isPending,
    error,
    onClose,
    onConfirm,
}: CancelRideModalProps) {
    const { t } = useTranslation();

    const {
        control,
        handleSubmit,
        formState: { isValid },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: { reason: "" },
    });

    const onSubmit: SubmitHandler<FormValues> = ({ reason }) =>
        onConfirm(reason.trim());

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-modal-viewport max-w-lg p-8"
            >
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-text-primary">
                        {t("admin.forceCancelRide")} — {rideRoute}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<span aria-hidden>✕</span>}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                <div className="bg-danger-bg border border-danger-border rounded-xl p-4 mb-5 text-sm text-danger-text">
                    {t("admin.cancelRideWarning")}
                </div>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-text-primary mb-1.5 block">
                        {t("admin.reasonForCancel")}{" "}
                        <span className="text-danger-text">*</span>
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
                        {t(getErrorI18nKey(error, adminRidesErrorMap))}
                    </p>
                )}

                <div className="flex gap-3 justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {t("admin.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="red"
                        disabled={!isValid || isPending}
                    >
                        ⊘ {t("admin.confirmCancel")}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
