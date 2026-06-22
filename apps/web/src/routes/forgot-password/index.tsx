import { createFileRoute } from "@tanstack/react-router";
import { useLayout } from "../../lib/use-layout";
import { EmailStep } from "./-components/EmailStep";
import { ResetStep } from "./-components/ResetStep";
import { SentStep } from "./-components/SentStep";
import { useForgotPasswordFlow } from "./-hooks/useForgotPasswordFlow";

export const Route = createFileRoute("/forgot-password/")({
    component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
    const { theme } = useLayout();
    const flow = useForgotPasswordFlow();
    const {
        form: {
            register,
            formState: { errors },
        },
    } = flow;

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background flex items-center justify-center px-4"
        >
            <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-8 flex flex-col items-center text-center">
                {flow.step === 1 && (
                    <EmailStep
                        register={register}
                        errors={errors}
                        resetError={flow.resetError}
                        isSendingReset={flow.isSendingReset}
                        onSendCode={flow.handleSendCode}
                        onBackToLogin={flow.navigateToLogin}
                    />
                )}
                {flow.step === 2 && (
                    <SentStep
                        email={flow.enteredEmail}
                        countdown={flow.countdown}
                        onResend={flow.handleSendCode}
                        onBackToLogin={flow.navigateToLogin}
                    />
                )}
                {flow.step === 3 && (
                    <ResetStep
                        register={register}
                        errors={errors}
                        resetError={flow.resetError}
                        isResettingPassword={flow.isResettingPassword}
                        onSetPassword={flow.handleSetPassword}
                    />
                )}
            </div>
        </div>
    );
}
