import { useTranslation } from "react-i18next";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Button, CheckIcon, LockIcon, PasswordInput } from "@waymate/ui";
import { FieldError } from "../../../components/shared/FieldError";
import type { ForgotPasswordFormValues } from "../-hooks/useForgotPasswordFlow";
import { ProgressDots } from "./ProgressDots";
import { StepVisual } from "./StepVisual";

type ResetStepProps = {
    register: UseFormRegister<ForgotPasswordFormValues>;
    errors: FieldErrors<ForgotPasswordFormValues>;
    resetError: string | null;
    isResettingPassword: boolean;
    onSetPassword: () => void;
};

export function ResetStep({
    register,
    errors,
    resetError,
    isResettingPassword,
    onSetPassword,
}: ResetStepProps) {
    const { t } = useTranslation();

    return (
        <>
            <ProgressDots step={3} />
            <StepVisual>
                <LockIcon />
            </StepVisual>
            <h1 className="text-xl font-bold text-text-primary mb-2">
                {t("forgotPassword.step3Title")}
            </h1>
            <p className="text-sm text-text-secondary mb-6">
                {t("forgotPassword.step3Subtitle")}
            </p>

            <div className="w-full flex flex-col gap-4 mb-6">
                <div className="text-left">
                    <label className="text-sm font-semibold text-text-primary mb-1 block">
                        {t("forgotPassword.newPassword")}
                    </label>
                    <PasswordInput
                        {...register("newPassword")}
                        placeholder="********"
                        showPasswordLabel={t("forgotPassword.showPassword")}
                        hidePasswordLabel={t("forgotPassword.hidePassword")}
                    />
                    <FieldError className="mt-2">
                        {errors.newPassword?.message &&
                            t(errors.newPassword.message)}
                    </FieldError>
                </div>
                <div className="text-left">
                    <label className="text-sm font-semibold text-text-primary mb-1 block">
                        {t("forgotPassword.confirmPassword")}
                    </label>
                    <PasswordInput
                        {...register("confirmPassword")}
                        placeholder="********"
                        showPasswordLabel={t("forgotPassword.showPassword")}
                        hidePasswordLabel={t("forgotPassword.hidePassword")}
                    />
                    <FieldError className="mt-2">
                        {errors.confirmPassword?.message &&
                            t(errors.confirmPassword.message)}
                    </FieldError>
                </div>
            </div>

            <Button
                fullWidth
                leftIcon={<CheckIcon />}
                onClick={onSetPassword}
            >
                {isResettingPassword
                    ? t("forgotPassword.settingPassword")
                    : t("forgotPassword.setPassword")}
            </Button>
            {resetError && (
                <FieldError className="mt-3">{t(resetError)}</FieldError>
            )}
        </>
    );
}
