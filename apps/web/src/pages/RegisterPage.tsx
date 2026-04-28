import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AuthNavbar, Button, RegisterBox } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import {
    getPostAuthPath,
    signInWithGoogle,
    signUpWithEmail,
} from "../lib/auth";

type RegisterPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

type FormValues = {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
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
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [errors, setErrors] = useState<{
        fullName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        form?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formSchema = z
        .object({
            fullName: z.string().trim().min(1, t("register.requiredError")),
            email: z
                .string()
                .trim()
                .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
                    message: t("register.invalidEmail"),
                }),
            password: z.string().min(8, t("register.passwordTooShort")),
            confirmPassword: z.string(),
        })
        .refine((values) => values.password === values.confirmPassword, {
            path: ["confirmPassword"],
            message: t("register.passwordMismatch"),
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
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const fullName = watch("fullName");
    const email = watch("email");
    const password = watch("password");
    const confirmPassword = watch("confirmPassword");

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            await signUpWithEmail({
                name: values.fullName.trim(),
                email: values.email.trim(),
                password: values.password,
            });
            setRegisteredEmail(email.trim());
        } catch (error) {
            setError("root", {
                message:
                    error instanceof Error
                        ? error.message
                        : t("register.error"),
            });
        }
    };

    async function handleGoogleRegister() {
        clearErrors();
        setIsGoogleLoading(true);
        try {
            const response = await signInWithGoogle();
            if (response.url) {
                window.location.href = response.url;
                return;
            }
            navigate(await getPostAuthPath());
        } catch (error) {
            const message =
                error instanceof Error ? error.message : t("register.error");
            setError("root", {
                message:
                    message === "Google login is not configured on the API."
                        ? t("register.googleNotConfigured")
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
                        fullName={fullName}
                        email={email}
                        password={password}
                        confirmPassword={confirmPassword}
                        fullNameError={errors.fullName}
                        emailError={errors.email}
                        passwordError={errors.password}
                        confirmPasswordError={errors.confirmPassword}
                        message={errors.form}
                        isSubmitting={isSubmitting}
                        onFullNameChange={setFullName}
                        onEmailChange={setEmail}
                        onPasswordChange={setPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        onSubmit={handleCreateAccount}
                        onGoogleRegisterClick={handleGoogleRegister}
                        onLoginClick={() => navigate("/login")}
                        labels={{
                            title: t("register.title"),
                            fullName: t("register.fullName"),
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
