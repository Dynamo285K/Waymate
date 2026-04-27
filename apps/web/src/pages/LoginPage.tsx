import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AuthNavbar, LoginBox } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import {
    getPostAuthPath,
    signInWithEmail,
    signInWithGoogle,
} from "../lib/auth";

type LoginPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

export function LoginPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
}: LoginPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        form?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    function validateForm() {
        const nextErrors: typeof errors = {};
        const trimmedEmail = email.trim();

        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            nextErrors.email = t("login.invalidEmail");
        }

        if (password.length < 8) {
            nextErrors.password = t("login.passwordTooShort");
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit() {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            await signInWithEmail({
                email: email.trim(),
                password,
            });
            navigate(await getPostAuthPath());
        } catch (error) {
            setErrors({
                form:
                    error instanceof Error ? error.message : t("login.error"),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleGoogleLogin() {
        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await signInWithGoogle();
            if (response.url) {
                window.location.href = response.url;
                return;
            }
            navigate(await getPostAuthPath());
        } catch (error) {
            const message =
                error instanceof Error ? error.message : t("login.error");
            setErrors({
                form:
                    message === "Google login is not configured on the API."
                        ? t("login.googleNotConfigured")
                        : message,
            });
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
                <LoginBox
                    email={email}
                    password={password}
                    emailError={errors.email}
                    passwordError={errors.password}
                    message={errors.form}
                    isSubmitting={isSubmitting}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                    onSubmit={handleSubmit}
                    onGoogleLoginClick={handleGoogleLogin}
                    onForgotPasswordClick={() => navigate("/forgot-password")}
                    onCreateAccountClick={() => navigate("/register")}
                    labels={{
                        title: t("login.title"),
                        emailLabel: t("login.emailLabel"),
                        emailPlaceholder: t("login.emailPlaceholder"),
                        passwordLabel: t("login.passwordLabel"),
                        passwordPlaceholder: t("login.passwordPlaceholder"),
                        forgotPassword: t("login.forgotPassword"),
                        loginButton: t("login.loginButton"),
                        loginWithGoogle: t("login.loginWithGoogle"),
                        or: t("login.or"),
                        noAccount: t("login.noAccount"),
                        createAccount: t("login.createAccount"),
                    }}
                />
            </div>
        </div>
    );
}
