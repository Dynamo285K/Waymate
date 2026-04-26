import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AuthNavbar, Button, RegisterBox } from "waymate-ui";
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
                <RegisterBox
                    fullName={fullName}
                    email={email}
                    password={password}
                    confirmPassword={confirmPassword}
                    message={message}
                    isSubmitting={isSubmitting}
                    onFullNameChange={setFullName}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    onCreateAccountClick={handleCreateAccount}
                    onGoogleRegisterClick={handleGoogleRegister}
                    onLoginClick={() => navigate("/login")}
                    labels={{
                        title: t("register.title"),
                        fullName: t("register.fullName"),
                        email: t("register.email"),
                        password: t("register.password"),
                        confirmPassword: t("register.confirmPassword"),
                        createAccountButton: t("register.createAccountButton"),
                        continueWithGoogle: t("register.continueWithGoogle"),
                        or: t("register.or"),
                        alreadyHaveAccount: t("register.alreadyHaveAccount"),
                        login: t("register.login"),
                    }}
                />
            </div>

            {verificationEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm rounded-2xl border border-(--color-border) bg-(--color-card) p-6 text-center shadow-2xl">
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
