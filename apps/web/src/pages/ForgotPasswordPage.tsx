import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { Button } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { requestPasswordReset, resetPassword } from "../lib/auth";

type ForgotPasswordPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

type FormValues = {
    email: string;
    newPassword: string;
    confirmPassword: string;
};

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
        initialFromUrl.hasError ? t("forgotPassword.invalidToken") : null
    );
    const [resetToken] = useState<string | null>(initialFromUrl.token);

    const formSchema = z
        .object({
            email: z
                .string()
                .trim()
                .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
                    message: t("login.invalidEmail"),
                }),
            newPassword: z.string().min(8, t("register.passwordTooShort")),
            confirmPassword: z.string(),
        })
        .refine((values) => values.newPassword === values.confirmPassword, {
            path: ["confirmPassword"],
            message: t("register.passwordMismatch"),
        });

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
            setResetError(t("forgotPassword.error"));
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
            setResetError(t("forgotPassword.resetError"));
            return;
        }

        navigate("/login");
    }

    const inputClass =
        "w-full rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) px-3 py-3 text-sm outline-none focus:border-(--color-primary) transition-colors font-[Inter,sans-serif]";

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
                            <div className="flex items-center border border-(--color-border) rounded-xl bg-(--color-input-bg) px-3 gap-2">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-(--color-text-secondary) flex-shrink-0"
                                >
                                    <rect
                                        width="20"
                                        height="16"
                                        x="2"
                                        y="4"
                                        rx="2"
                                    />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                <input
                                    className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-(--color-text-primary)"
                                    placeholder={t(
                                        "forgotPassword.emailPlaceholder"
                                    )}
                                    type="email"
                                    {...register("email")}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-xs font-semibold text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
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
                            <p className="mt-3 text-xs font-semibold text-red-500">
                                {resetError}
                            </p>
                        )}
                        <button
                            className="mt-4 text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
                            onClick={() => navigate("/login")}
                        >
                            {t("forgotPassword.backToLogin")}
                        </button>
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
                                <button
                                    className="font-bold text-(--color-primary) hover:underline"
                                    onClick={handleSendCode}
                                >
                                    {t("forgotPassword.resend")}
                                </button>
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
                                    <input
                                        className="flex-1 bg-transparent border-none outline-none py-3 text-sm text-(--color-text-primary)"
                                        type={showPw ? "text" : "password"}
                                        placeholder="••••••••"
                                        {...register("newPassword")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw((v) => !v)}
                                        className="text-(--color-text-secondary)"
                                    >
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
                                    </button>
                                </div>
                                {errors.newPassword && (
                                    <p className="mt-2 text-xs font-semibold text-red-500">
                                        {errors.newPassword.message}
                                    </p>
                                )}
                            </div>
                            <div className="text-left">
                                <label className="text-sm font-semibold text-(--color-text-primary) mb-1 block">
                                    {t("forgotPassword.confirmPassword")}
                                </label>
                                <input
                                    className={inputClass}
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-2 text-xs font-semibold text-red-500">
                                        {errors.confirmPassword.message}
                                    </p>
                                )}
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
                            <p className="mt-3 text-xs font-semibold text-red-500">
                                {resetError}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
