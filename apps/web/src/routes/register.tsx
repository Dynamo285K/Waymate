import { useState } from "react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthNavbar, Button, RegisterBox } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { useAuthNavbarProps } from "../hooks/shared/useAuthNavbarProps";
import {
    getPostAuthPath,
    signInWithGoogle,
    signUpWithEmail,
} from "../lib/auth";
import {
    getEmailAuthErrorI18nKey,
    getGoogleAuthErrorI18nKey,
} from "../lib/auth-errors";
import { requireAudience } from "../lib/route-guards";
import { makeAudienceComponent } from "../lib/make-audience-component";

export const Route = createFileRoute("/register")({
    beforeLoad: requireAudience(["guest"]),
    component: makeAudienceComponent(RegisterPage),
});

type RegisterPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

const registerFormSchema = z
    .object({
        email: z
            .string()
            .trim()
            .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
                message: "register.invalidEmail",
            }),
        password: z.string().min(8, "register.passwordTooShort"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "register.passwordMismatch",
        path: ["confirmPassword"],
    });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

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
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const {
        handleSubmit,
        control,
        setValue,
        setError,
        clearErrors,
        formState: { errors, isSubmitting, isSubmitted },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerFormSchema),
        defaultValues: { email: "", password: "", confirmPassword: "" },
    });

    const email = useWatch({ control, name: "email" });
    const password = useWatch({ control, name: "password" });
    const confirmPassword = useWatch({ control, name: "confirmPassword" });

    const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
        const trimmedEmail = values.email.trim();
        const { error } = await signUpWithEmail({
            email: trimmedEmail,
            password: values.password,
        });

        if (error) {
            if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
                setError("email", { message: "register.emailAlreadyInUse" });
                return;
            }
            console.error("Email sign-up failed", error);
            setError("root", {
                message: getEmailAuthErrorI18nKey(error, "register.error"),
            });
            return;
        }

        setRegisteredEmail(trimmedEmail);
    };

    async function handleGoogleRegister() {
        clearErrors();
        setIsGoogleLoading(true);
        try {
            const { data, error } = await signInWithGoogle();

            if (error) {
                console.error("Google sign-in failed", error);
                setError("root", {
                    message: getGoogleAuthErrorI18nKey(error, "register.error"),
                });
                return;
            }

            if (data?.url) {
                window.location.href = data.url;
                return;
            }

            navigate({ to: await getPostAuthPath() });
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
                            <Button onClick={() => navigate({ to: "/login" })}>
                                {t("register.backToLogin")}
                            </Button>
                        </div>
                    </section>
                ) : (
                    <RegisterBox
                        email={email}
                        password={password}
                        confirmPassword={confirmPassword}
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
                        confirmPasswordError={
                            errors.confirmPassword?.message
                                ? t(errors.confirmPassword.message)
                                : undefined
                        }
                        message={
                            errors.root?.message
                                ? t(errors.root.message)
                                : undefined
                        }
                        isSubmitting={submitting}
                        onEmailChange={(value) =>
                            setValue("email", value, {
                                shouldValidate: isSubmitted,
                            })
                        }
                        onPasswordChange={(value) =>
                            setValue("password", value, {
                                shouldValidate: isSubmitted,
                            })
                        }
                        onConfirmPasswordChange={(value) =>
                            setValue("confirmPassword", value, {
                                shouldValidate: isSubmitted,
                            })
                        }
                        onSubmit={handleSubmit(onSubmit)}
                        onGoogleRegisterClick={handleGoogleRegister}
                        onLoginClick={() => navigate({ to: "/login" })}
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
