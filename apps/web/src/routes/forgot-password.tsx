import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "../lib/router-compat";
import { Button, Input, TextLink, IconButton } from "@waymate/ui";
import { FieldError } from "../components/shared/FieldError";
import type { Language } from "../components/controls/LanguageSwitcher";
import { requestPasswordReset, resetPassword } from "../lib/auth";
import { requireAudience } from "../lib/route-guards";
import { makeAudienceComponent } from "../lib/make-audience-component";

export const Route = createFileRoute("/forgot-password")({
    beforeLoad: requireAudience(["guest"]),
    component: makeAudienceComponent(ForgotPasswordPage),
});

type ForgotPasswordPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

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
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${n <= step ? "bg-(--color-primary)" : "bg-(--color-border)"}`}
                />
            ))}
        </div>
    );
}

function IconCircle({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-16 h-16 rounded-full bg-(--color-success-bg) flex items-center justify-center mx-auto mb-5 text-(--color-success-text)">
            {children}
        </div>
    );
}

export function ForgotPasswordPage({ theme }: ForgotPasswordPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
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

        navigate("/login");
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg) flex items-center justify-center px-4"
        >
            <div className="bg-(--color-card) rounded-2xl border border-(--color-border) shadow-xl w-full max-w-sm p-8 flex flex-col items-center text-center">
                {/* Step 1 — Enter email */}
                {step === 1 && (
                    <>
                        <ProgressDots step={1} />
                        <IconCircle>
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 2v6h-6" />
                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                    ry="2"
                                />
                                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                        </IconCircle>
                        <h1 className="text-xl font-bold text-(--color-text-primary) mb-2">
                            {t("forgotPassword.step1Title")}
                        </h1>
                        <p className="text-sm text-(--color-text-secondary) mb-6">
                            {t("forgotPassword.step1Subtitle")}
                        </p>

                        <div className="w-full text-left mb-4">
                            <label className="text-sm font-semibold text-(--color-text-primary) mb-1 block">
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
                            onClick={handleSendCode}
                        >
                            {isSendingReset
                                ? t("forgotPassword.sending")
                                : `➤ ${t("forgotPassword.sendCode")}`}
                        </Button>
                        {resetError && (
                            <FieldError className="mt-3">
                                {t(resetError)}
                            </FieldError>
                        )}
                        <div className="mt-4 text-sm">
                            <TextLink
                                variant="muted"
                                onClick={() => navigate("/login")}
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
                        <IconCircle>
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    width="20"
                                    height="16"
                                    x="2"
                                    y="4"
                                    rx="2"
                                />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                <polyline points="16 17 18 19 22 15" />
                            </svg>
                        </IconCircle>
                        <h1 className="text-xl font-bold text-(--color-text-primary) mb-2">
                            {t("forgotPassword.step2Title")}
                        </h1>
                        <p className="text-sm text-(--color-text-secondary) mb-1">
                            {t("forgotPassword.resetLinkSent")}
                        </p>
                        <p className="text-sm font-bold text-(--color-text-primary) mb-6">
                            {enteredEmail}
                        </p>

                        <Button
                            fullWidth
                            onClick={() => navigate("/login")}
                        >
                            {t("forgotPassword.backToLogin")}
                        </Button>

                        <p className="mt-4 text-xs text-(--color-text-secondary)">
                            {t("forgotPassword.resendIn")}{" "}
                            {countdown > 0 ? (
                                <span className="font-bold text-(--color-text-primary)">
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
                        <IconCircle>
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                stroke="none"
                            >
                                <path d="M12 1C9.24 1 7 3.24 7 6v2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                            </svg>
                        </IconCircle>
                        <h1 className="text-xl font-bold text-(--color-text-primary) mb-2">
                            {t("forgotPassword.step3Title")}
                        </h1>
                        <p className="text-sm text-(--color-text-secondary) mb-6">
                            {t("forgotPassword.step3Subtitle")}
                        </p>

                        <div className="w-full flex flex-col gap-4 mb-6">
                            <div className="text-left">
                                <label className="text-sm font-semibold text-(--color-text-primary) mb-1 block">
                                    {t("forgotPassword.newPassword")}
                                </label>
                                <div className="flex items-center border border-(--color-border) rounded-xl bg-(--color-input-bg) px-3 gap-2">
                                    <Input
                                        {...register("newPassword")}
                                        type={showPw ? "text" : "password"}
                                        placeholder="••••••••"
                                    />
                                    <IconButton
                                        ariaLabel="Toggle password visibility"
                                        icon={
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="3"
                                                />
                                            </svg>
                                        }
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
                                <label className="text-sm font-semibold text-(--color-text-primary) mb-1 block">
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
                            onClick={handleSetPassword}
                        >
                            {isResettingPassword
                                ? t("forgotPassword.settingPassword")
                                : `✓ ${t("forgotPassword.setPassword")}`}
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
