import { useState, useEffect } from "react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "../lib/router-compat";
import { AuthNavbar, LoginBox } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { useAuthNavbarProps } from "../hooks/useAuthNavbarProps";
import {
    getPostAuthPath,
    signInWithEmail,
    signInWithGoogle,
} from "../lib/auth";
import {
    getEmailAuthErrorI18nKey,
    getGoogleAuthErrorI18nKey,
} from "../lib/auth-errors";

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
    const [searchParams] = useSearchParams();
    const authNavbarProps = useAuthNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
    });
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const formSchema = z.object({
        email: z
            .string()
            .trim()
            .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
                message: "login.invalidEmail",
            }),
        password: z.string().min(8, "login.passwordTooShort"),
    });

    const {
        handleSubmit,
        control,
        setValue,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" },
    });

    const email = useWatch({ control, name: "email" });
    const password = useWatch({ control, name: "password" });

    useEffect(() => {
        const urlError = searchParams.get("error");
        if (urlError === "banned") {
            setError("root", { message: "login.banned" });
        } else if (urlError) {
            setError("root", { message: "login.error" });
        }
    }, [searchParams, setError]);

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        const { error } = await signInWithEmail({
            email: values.email.trim(),
            password: values.password,
        });

        if (error) {
            console.error("Email sign-in failed", error);
            setError("root", {
                message: getEmailAuthErrorI18nKey(error, "login.error"),
            });
            return;
        }

        navigate(await getPostAuthPath());
    };

    async function handleGoogleLogin() {
        clearErrors();
        setIsGoogleLoading(true);
        try {
            const { data, error } = await signInWithGoogle();

            if (error) {
                console.error("Google sign-in failed", error);
                setError("root", {
                    message: getGoogleAuthErrorI18nKey(error, "login.error"),
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
                <LoginBox
                    email={email}
                    password={password}
                    emailError={
                        errors.email?.message
                            ? t(errors.email.message)
                            : undefined
                    }
                    passwordError={
                        errors.password?.message
                            ? t(errors.password.message)
                            : undefined
                    }
                    message={
                        errors.root?.message
                            ? t(errors.root.message)
                            : undefined
                    }
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
