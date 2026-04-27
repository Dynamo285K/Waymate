import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { Button } from "@waymate/ui";
import type { Language } from "@waymate/ui";

type ForgotPasswordPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
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
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 text-green-600">
            {children}
        </div>
    );
}

export function ForgotPasswordPage({ theme }: ForgotPasswordPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [countdown, setCountdown] = useState(59);
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (step !== 2) return;
        setCountdown(59);
        const timer = setInterval(
            () => setCountdown((c) => (c > 0 ? c - 1 : 0)),
            1000
        );
        return () => clearInterval(timer);
    }, [step]);

    function handleCodeInput(idx: number, val: string) {
        const digit = val.replace(/\D/g, "").slice(-1);
        const next = [...code];
        next[idx] = digit;
        setCode(next);
        if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
    }

    function handleCodeKey(idx: number, e: React.KeyboardEvent) {
        if (e.key === "Backspace" && !code[idx] && idx > 0) {
            codeRefs.current[idx - 1]?.focus();
        }
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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                />
                            </div>
                        </div>

                        <Button
                            fullWidth
                            onClick={() => setStep(2)}
                        >
                            ➤ {t("forgotPassword.sendCode")}
                        </Button>
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
                            {t("forgotPassword.step2Subtitle")}
                        </p>
                        <p className="text-sm font-bold text-(--color-text-primary) mb-6">
                            {email}
                        </p>

                        <div className="flex gap-2 mb-4">
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => {
                                        codeRefs.current[i] = el;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) =>
                                        handleCodeInput(i, e.target.value)
                                    }
                                    onKeyDown={(e) => handleCodeKey(i, e)}
                                    className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-colors bg-(--color-input-bg) text-(--color-text-primary) ${digit ? "border-(--color-primary)" : "border-(--color-border)"} focus:border-(--color-primary)`}
                                />
                            ))}
                        </div>

                        <Button
                            fullWidth
                            onClick={() => setStep(3)}
                        >
                            ✓ {t("forgotPassword.verifyCode")}
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
                                    onClick={() => setCountdown(59)}
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
                                        value={newPw}
                                        onChange={(e) =>
                                            setNewPw(e.target.value)
                                        }
                                        placeholder="••••••••"
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
                            </div>
                            <div className="text-left">
                                <label className="text-sm font-semibold text-(--color-text-primary) mb-1 block">
                                    {t("forgotPassword.confirmPassword")}
                                </label>
                                <input
                                    className={inputClass}
                                    type="password"
                                    value={confirmPw}
                                    onChange={(e) =>
                                        setConfirmPw(e.target.value)
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button
                            fullWidth
                            onClick={() => navigate("/login")}
                        >
                            ✓ {t("forgotPassword.setPassword")}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
