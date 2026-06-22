import { useTranslation } from "react-i18next";
import { Button, MailIcon, TextLink } from "@waymate/ui";
import { ProgressDots } from "./ProgressDots";
import { StepVisual } from "./StepVisual";

type SentStepProps = {
    email?: string;
    countdown: number;
    onResend: () => void;
    onBackToLogin: () => void;
};

export function SentStep({
    email,
    countdown,
    onResend,
    onBackToLogin,
}: SentStepProps) {
    const { t } = useTranslation();

    return (
        <>
            <ProgressDots step={2} />
            <StepVisual>
                <MailIcon />
            </StepVisual>
            <h1 className="text-xl font-bold text-text-primary mb-2">
                {t("forgotPassword.step2Title")}
            </h1>
            <p className="text-sm text-text-secondary mb-1">
                {t("forgotPassword.resetLinkSent")}
            </p>
            <p className="text-sm font-bold text-text-primary mb-6">{email}</p>

            <Button
                fullWidth
                onClick={onBackToLogin}
            >
                {t("forgotPassword.backToLogin")}
            </Button>

            <p className="mt-4 text-xs text-text-secondary">
                {t("forgotPassword.resendIn")}{" "}
                {countdown > 0 ? (
                    <span className="font-bold text-text-primary">
                        {countdown}s
                    </span>
                ) : (
                    <TextLink
                        variant="primary"
                        onClick={onResend}
                    >
                        {t("forgotPassword.resend")}
                    </TextLink>
                )}
            </p>
        </>
    );
}
