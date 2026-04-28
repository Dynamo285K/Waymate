import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

type FormValues = {
    email: string;
    password: string;
};

export function LoginPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
}: LoginPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const formSchema = z.object({
        email: z
            .string()
            .trim()
            .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
                message: t("login.invalidEmail"),
            }),
        password: z.string().min(8, t("login.passwordTooShort")),
    });

    const {
        handleSubmit,
        watch,
        setValue,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    });

    const email = watch("email");
    const password = watch("password");

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            await signInWithEmail({
                email: values.email.trim(),
                password: values.password,
            });
            navigate(await getPostAuthPath());
        } catch (error) {
            setError("root", {
                message:
                    error instanceof Error ? error.message : t("login.error"),
            });
        }
    };

    async function handleGoogleLogin() {
        clearErrors();
        setIsGoogleLoading(true);
        try {
            const response = await signInWithGoogle();
            if (response.url) {
                window.location.href = response.url;
                return;
            }
            navigate("/passenger");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : t("login.error");
            setError("root", {
                message:
                    message === "Google login is not configured on the API."
                        ? t("login.googleNotConfigured")
                        : message,
            });
            setIsGoogleLoading(false);
        }
    }

    const submitting = isSubmitting || isGoogleLoading;

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
                    emailError={errors.email?.message}
                    passwordError={errors.password?.message}
                    message={errors.root?.message}
                    isSubmitting={submitting}
                    onEmailChange={(value) => setValue("email", value)}
                    onPasswordChange={(value) => setValue("password", value)}
                    onSubmit={handleSubmit(onSubmit)}
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
