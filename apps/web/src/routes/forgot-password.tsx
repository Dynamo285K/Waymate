import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
    Button,
    CheckIcon,
    EyeIcon,
    IconButton,
    Input,
    LockIcon,
    MailIcon,
    SendIcon,
    TextLink,
} from "@waymate/ui";
import { FieldError } from "../components/shared/FieldError";
import { requestPasswordReset, resetPassword } from "../lib/auth";
import { useLayout } from "../lib/use-layout";
import { requireAudience } from "../lib/route-guards";

export const Route = createFileRoute("/forgot-password")({
    beforeLoad: requireAudience(["guest"]),
    component: ForgotPasswordPage,
});

const formSchema = z
    .object({
        email: z
            .string()
            .trim()
            .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
                message: "login.invalidEmail",
            }),
        newPassword: z.string().min(8, "register.passwordTooShort"),
        confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        path: ["confirmPassword"],
        message: "register.passwordMismatch",
    });

type FormValues = z.infer<typeof formSchema>;

function ProgressDots({ step }: { step: 1 | 2 | 3 }) {
    return (
        <div className="flex gap-2 justify-center mb-6">
            {[1, 2, 3].map((n) => (
                <span
                    key={n}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${n <= step ? "bg-primary" : "bg-border"}`}
                />
            ))}
        </div>
    );
}

function StepVisual({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-5 text-success-text">
            {children}
        </div>
    );
}

function ForgotPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { theme } = useLayout();
    const initialFromUrl = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const error = params.get("error");
        return {
            token,
            hasError: Boolean(error),
            step: (token ? 3 : 1) as 1 | 3,
        };
    }, []);
    const [step, setStep] = useState<1 | 2 | 3>(initialFromUrl.step);
    const [countdown, setCountdown] = useState(59);
    const [showPw, setShowPw] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [resetError, setResetError] = useState<string | null>(
        initialFromUrl.hasError ? "forgotPassword.invalidToken" : null
    );
    const [resetToken] = useState<string | null>(initialFromUrl.token);

    const {
        register,
        trigger,
        control,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", newPassword: "", confirmPassword: "" },
    });

    const enteredEmail = useWatch({ control, name: "email" });
    const newPassword = useWatch({ control, name: "newPassword" });

    const [prevStep, setPrevStep] = useState(step);
    if (step !== prevStep) {
        setPrevStep(step);
        if (step === 2) setCountdown(59);
    }

    useEffect(() => {
        if (step !== 2) return;
        const timer = setInterval(
            () => setCountdown((c) => (c > 0 ? c - 1 : 0)),
            1000
        );
        return () => clearInterval(timer);
    }, [step]);

    async function handleSendCode() {
        const ok = await trigger("email");
        if (!ok || isSendingReset) return;

        setIsSendingReset(true);
        setResetError(null);

        const { error } = await requestPasswordReset({ email: enteredEmail });

        setIsSendingReset(false);

        if (error) {
            setResetError("forgotPassword.error");
            return;
        }

        setStep(2);
    }

    async function handleSetPassword() {
        const ok = await trigger(["newPassword", "confirmPassword"]);
        if (!ok || !resetToken || isResettingPassword) return;

        setIsResettingPassword(true);
        setResetError(null);

        const { error } = await resetPassword({
            token: resetToken,
            newPassword,
        });

        setIsResettingPassword(false);

        if (error) {
            setResetError("forgotPassword.resetError");
            return;
        }

        navigate({ to: "/login" });
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background flex items-center justify-center px-4"
        >
            <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-8 flex flex-col items-center text-center">
                {/* Step 1 — Enter email */}
                {step === 1 && (
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
                                placeholder={t(
                                    "forgotPassword.emailPlaceholder"
                                )}
                                type="email"
                                {...register("email")}
                            />
                            <FieldError className="mt-2">
                                {errors.email?.message &&
                                    t(errors.email.message)}
                            </FieldError>
                        </div>

                        <Button
                            fullWidth
                            leftIcon={<SendIcon />}
                            onClick={handleSendCode}
                        >
                            {isSendingReset
                                ? t("forgotPassword.sending")
                                : t("forgotPassword.sendCode")}
                        </Button>
                        {resetError && (
                            <FieldError className="mt-3">
                                {t(resetError)}
                            </FieldError>
                        )}
                        <div className="mt-4 text-sm">
                            <TextLink
                                variant="muted"
                                onClick={() => navigate({ to: "/login" })}
                            >
                                {t("forgotPassword.backToLogin")}
                            </TextLink>
                        </div>
                    </>
                )}

                {/* Step 2 — Verify code */}
                {step === 2 && (
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
                        <p className="text-sm font-bold text-text-primary mb-6">
                            {enteredEmail}
                        </p>

                        <Button
                            fullWidth
                            onClick={() => navigate({ to: "/login" })}
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
                                    onClick={handleSendCode}
                                >
                                    {t("forgotPassword.resend")}
                                </TextLink>
                            )}
                        </p>
                    </>
                )}

                {/* Step 3 — Set new password */}
                {step === 3 && (
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
                                <div className="flex items-center border border-border rounded-xl bg-input px-3 gap-2">
                                    <Input
                                        {...register("newPassword")}
                                        type={showPw ? "text" : "password"}
                                        placeholder="••••••••"
                                    />
                                    <IconButton
                                        ariaLabel="Toggle password visibility"
                                        icon={<EyeIcon />}
                                        variant="ghost"
                                        onClick={() => setShowPw((v) => !v)}
                                    />
                                </div>
                                <FieldError className="mt-2">
                                    {errors.newPassword?.message &&
                                        t(errors.newPassword.message)}
                                </FieldError>
                            </div>
                            <div className="text-left">
                                <label className="text-sm font-semibold text-text-primary mb-1 block">
                                    {t("forgotPassword.confirmPassword")}
                                </label>
                                <Input
                                    {...register("confirmPassword")}
                                    type="password"
                                    placeholder="••••••••"
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
                            onClick={handleSetPassword}
                        >
                            {isResettingPassword
                                ? t("forgotPassword.settingPassword")
                                : t("forgotPassword.setPassword")}
                        </Button>
                        {resetError && (
                            <FieldError className="mt-3">
                                {t(resetError)}
                            </FieldError>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
