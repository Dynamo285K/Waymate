import { useEffect, useMemo } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Modal, Button, Textarea } from "@waymate/ui";
import { useLayout } from "../../lib/use-layout";

export type CancelRideDialogProps = {
    open: boolean;
    loading?: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    title?: string;
    message?: string;
    reasonRequired?: boolean;
};

export function CancelRideDialog({
    open,
    loading,
    onOpenChange,
    onConfirm,
    title,
    message,
    reasonRequired,
}: CancelRideDialogProps) {
    const { t } = useTranslation();
    const { theme } = useLayout();

    const schema = useMemo(
        () =>
            z.object({
                reason: reasonRequired ? z.string().trim().min(1) : z.string(),
            }),
        [reasonRequired]
    );
    type FormValues = z.infer<typeof schema>;

    const {
        control,
        handleSubmit,
        reset,
        formState: { isValid },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        mode: "onChange",
        defaultValues: { reason: "" },
    });

    // This dialog stays mounted and is toggled via `open`, so clear the field
    // each time it closes (covers parent-driven closes too, e.g. after a
    // successful cancel). RHF's reset can't run during render, so it lives in an
    // effect — reset is not a setState, so this doesn't reintroduce a render
    // cascade.
    useEffect(() => {
        if (!open) reset({ reason: "" });
    }, [open, reset]);

    const onSubmit: SubmitHandler<FormValues> = ({ reason }) =>
        onConfirm(reason.trim());

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            theme={theme}
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                    {title ?? t("cancelRideDialog.title")}
                </h2>
                <p className="text-sm text-text-secondary mb-5 leading-relaxed">
                    {message ?? t("cancelRideDialog.message")}
                </p>
                <div className="mb-6">
                    <Controller
                        control={control}
                        name="reason"
                        render={({ field }) => (
                            <Textarea
                                label={
                                    reasonRequired
                                        ? t(
                                              "cancelRideDialog.reasonLabelRequired"
                                          )
                                        : t("cancelRideDialog.reasonLabel")
                                }
                                placeholder={t(
                                    "cancelRideDialog.reasonPlaceholder"
                                )}
                                value={field.value}
                                rows={3}
                                maxLength={500}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>
                <div className="flex gap-3 justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={loading}
                        onClick={() => onOpenChange(false)}
                    >
                        {t("cancelRideDialog.goBack")}
                    </Button>
                    <Button
                        type="submit"
                        variant="red"
                        disabled={loading || !isValid}
                    >
                        {t("cancelRideDialog.confirm")}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
