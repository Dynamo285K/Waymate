import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AuthNavbar, Button } from "waymate-ui";
import type { Language } from "waymate-ui";
import { apiFetch } from "../lib/api";

type RegisterPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

type SignUpResponse = {
    user: {
        email: string;
    };
};

type SocialSignInResponse = {
    url?: string;
};

export function RegisterPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
}: RegisterPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [verificationEmail, setVerificationEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputClass =
        "w-full rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) px-4 py-3 text-sm outline-none focus:border-(--color-primary) transition-colors";

    async function handleCreateAccount() {
        setMessage("");

        if (!fullName.trim() || !email.trim() || !password) {
            setMessage(t("register.requiredError"));
            return;
        }

        if (password !== confirmPassword) {
            setMessage(t("register.passwordMismatch"));
            return;
        }

        setIsSubmitting(true);
        try {
            const callbackURL = `${window.location.origin}/onboarding`;
            const response = await apiFetch<SignUpResponse>("/sign-up/email", {
                method: "POST",
                body: JSON.stringify({
                    name: fullName.trim(),
                    email: email.trim(),
                    password,
                    callbackURL,
                }),
            });

            setVerificationEmail(response.user.email);
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : t("register.error")
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleGoogleRegister() {
        setMessage("");
        setIsSubmitting(true);
        try {
            const callbackURL = `${window.location.origin}/onboarding`;
            const response = await apiFetch<SocialSignInResponse>(
                "/sign-in/social",
                {
                    method: "POST",
                    body: JSON.stringify({
                        provider: "google",
                        callbackURL,
                        newUserCallbackURL: callbackURL,
                    }),
                }
            );

            if (response.url) {
                window.location.href = response.url;
                return;
            }

            setVerificationEmail(email || t("register.yourEmail"));
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : t("register.error")
            );
            setIsSubmitting(false);
        }
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AuthNavbar
                language={language}
                onLanguageChange={onLanguageChange}
                theme={theme}
                onThemeToggle={onThemeToggle}
                onLogoClick={() => navigate("/")}
            />
            <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-4 py-12">
                <div className="w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-card) p-8 shadow-xl">
                    <h1 className="text-2xl font-bold text-(--color-text-primary) text-center mb-6">
                        {t("register.title")}
                    </h1>

                    <div className="flex flex-col gap-4">
                        <input
                            className={inputClass}
                            value={fullName}
                            onChange={(event) =>
                                setFullName(event.target.value)
                            }
                            placeholder={t("register.fullName")}
                            autoComplete="name"
                        />
                        <input
                            className={inputClass}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder={t("register.email")}
                            type="email"
                            autoComplete="email"
                        />
                        <input
                            className={inputClass}
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder={t("register.password")}
                            type="password"
                            autoComplete="new-password"
                        />
                        <input
                            className={inputClass}
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            placeholder={t("register.confirmPassword")}
                            type="password"
                            autoComplete="new-password"
                        />
                    </div>

                    {message && (
                        <p className="mt-4 text-sm font-semibold text-red-500">
                            {message}
                        </p>
                    )}

                    <div className="mt-6 flex flex-col gap-4">
                        <Button
                            fullWidth
                            onClick={handleCreateAccount}
                            disabled={isSubmitting}
                        >
                            {t("register.createAccountButton")}
                        </Button>

                        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-(--color-text-secondary)">
                            <span className="h-px flex-1 bg-(--color-border)" />
                            {t("register.or")}
                            <span className="h-px flex-1 bg-(--color-border)" />
                        </div>

                        <Button
                            fullWidth
                            variant="secondary"
                            onClick={handleGoogleRegister}
                            disabled={isSubmitting}
                        >
                            {t("register.continueWithGoogle")}
                        </Button>
                    </div>

                    <p className="mt-6 text-center text-sm text-(--color-text-secondary)">
                        {t("register.alreadyHaveAccount")}{" "}
                        <button
                            className="font-semibold text-(--color-primary) hover:underline"
                            onClick={() => navigate("/login")}
                        >
                            {t("register.login")}
                        </button>
                    </p>
                </div>
            </div>

            {verificationEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-card) p-6 text-center shadow-2xl">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <svg
                                width="26"
                                height="26"
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
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-(--color-text-primary)">
                            {t("register.checkEmailTitle")}
                        </h2>
                        <p className="mt-2 text-sm text-(--color-text-secondary)">
                            {t("register.checkEmailText", {
                                email: verificationEmail,
                            })}
                        </p>
                        <div className="mt-6">
                            <Button
                                fullWidth
                                onClick={() => navigate("/login")}
                            >
                                {t("register.backToLogin")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
