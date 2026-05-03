import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AuthNavbar, Button, RegisterBox } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useAuthNavbarProps } from "../hooks/useAuthNavbarProps";
import {
    getPostAuthPath,
    signInWithGoogle,
    signUpWithEmail,
} from "../lib/auth";
import {
    getEmailAuthErrorI18nKey,
    getGoogleAuthErrorI18nKey,
} from "../lib/auth-errors";

type RegisterPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

type RegisterErrors = {
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
};

export function RegisterPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
}: RegisterPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const authNavbarProps = useAuthNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
    });
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [errors, setErrors] = useState<RegisterErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    async function handleCreateAccount() {
        const nextErrors: RegisterErrors = {};
        const trimmedEmail = email.trim();

        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            nextErrors.email = t("register.invalidEmail");
        }

        if (password.length < 8) {
            nextErrors.password = t("register.passwordTooShort");
        }

        if (password !== confirmPassword) {
            nextErrors.confirmPassword = t("register.passwordMismatch");
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);
        try {
            const { error } = await signUpWithEmail({
                email: trimmedEmail,
                password,
            });

            if (error) {
                if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
                    setErrors({ email: t("register.emailAlreadyInUse") });
                    return;
                }
                console.error("Email sign-up failed", error);
                setErrors({
                    form: t(getEmailAuthErrorI18nKey(error, "register.error")),
                });
                return;
            }

            setRegisteredEmail(trimmedEmail);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleGoogleRegister() {
        setErrors({});
        setIsGoogleLoading(true);
        try {
            const { data, error } = await signInWithGoogle();

            if (error) {
                console.error("Google sign-in failed", error);
                setErrors({
                    form: t(getGoogleAuthErrorI18nKey(error, "register.error")),
                });
                return;
            }

            if (data?.url) {
                window.location.href = data.url;
                return;
            }

            navigate(await getPostAuthPath());
        } finally {
            setIsGoogleLoading(false);
        }
    }

    const submitting = isSubmitting || isGoogleLoading;

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AuthNavbar {...authNavbarProps} />

            <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-4 py-12">
                {registeredEmail ? (
                    <section className="w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-card) p-8 text-center shadow-xl">
                        <h1 className="text-2xl font-bold text-(--color-text-primary)">
                            {t("register.checkEmailTitle")}
                        </h1>
                        <p className="mt-3 text-sm text-(--color-text-secondary)">
                            {t("register.checkEmailText", {
                                email:
                                    registeredEmail || t("register.yourEmail"),
                            })}
                        </p>
                        <div className="mt-6">
                            <Button onClick={() => navigate("/login")}>
                                {t("register.backToLogin")}
                            </Button>
                        </div>
                    </section>
                ) : (
                    <RegisterBox
                        email={email}
                        password={password}
                        confirmPassword={confirmPassword}
                        emailError={errors.email}
                        passwordError={errors.password}
                        confirmPasswordError={errors.confirmPassword}
                        message={errors.form}
                        isSubmitting={submitting}
                        onEmailChange={setEmail}
                        onPasswordChange={setPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        onSubmit={handleCreateAccount}
                        onGoogleRegisterClick={handleGoogleRegister}
                        onLoginClick={() => navigate("/login")}
                        labels={{
                            title: t("register.title"),
                            email: t("register.email"),
                            password: t("register.password"),
                            confirmPassword: t("register.confirmPassword"),
                            createAccountButton: t(
                                "register.createAccountButton"
                            ),
                            continueWithGoogle: t(
                                "register.continueWithGoogle"
                            ),
                            or: t("register.or"),
                            alreadyHaveAccount: t(
                                "register.alreadyHaveAccount"
                            ),
                            login: t("register.login"),
                        }}
                    />
                )}
            </div>
        </div>
    );
}
