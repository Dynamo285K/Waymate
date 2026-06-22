import { useTranslation } from "react-i18next";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Button, Input, LockIcon, SendIcon, TextLink } from "@waymate/ui";
import { FieldError } from "../../../components/shared/FieldError";
import type { ForgotPasswordFormValues } from "../-hooks/useForgotPasswordFlow";
import { ProgressDots } from "./ProgressDots";
import { StepVisual } from "./StepVisual";

type EmailStepProps = {
    register: UseFormRegister<ForgotPasswordFormValues>;
    errors: FieldErrors<ForgotPasswordFormValues>;
    resetError: string | null;
    isSendingReset: boolean;
    onSendCode: () => void;
    onBackToLogin: () => void;
};

export function EmailStep({
    register,
    errors,
    resetError,
    isSendingReset,
    onSendCode,
    onBackToLogin,
}: EmailStepProps) {
    const { t } = useTranslation();

    return (
        <>
            <ProgressDots step={1} />
            <StepVisual>
                <LockIcon />
            </StepVisual>
            <h1 className="text-xl font-bold text-text-primary mb-2">
                {t("forgotPassword.step1Title")}
            </h1>
            <p className="text-sm text-text-secondary mb-6">
                {t("forgotPassword.step1Subtitle")}
            </p>

            <div className="w-full text-left mb-4">
                <label className="text-sm font-semibold text-text-primary mb-1 block">
                    {t("forgotPassword.emailLabel")}
                </label>
                <Input
                    placeholder={t("forgotPassword.emailPlaceholder")}
                    type="email"
                    {...register("email")}
                />
                <FieldError className="mt-2">
                    {errors.email?.message && t(errors.email.message)}
                </FieldError>
            </div>

            <Button
                fullWidth
                leftIcon={<SendIcon />}
                onClick={onSendCode}
            >
                {isSendingReset
                    ? t("forgotPassword.sending")
                    : t("forgotPassword.sendCode")}
            </Button>
            {resetError && (
                <FieldError className="mt-3">{t(resetError)}</FieldError>
            )}
            <div className="mt-4 text-sm">
                <TextLink
                    variant="muted"
                    onClick={onBackToLogin}
                >
                    {t("forgotPassword.backToLogin")}
                </TextLink>
            </div>
        </>
    );
}
