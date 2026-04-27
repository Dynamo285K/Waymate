import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OnboardingUserBodySchema } from "@repo/shared";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AuthNavbar, Button } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { apiFetch } from "../lib/api";
import { hasCompletedOnboarding } from "../lib/auth";

type OnboardingPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

type CurrentUser = {
    name: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
};

type FormValues = {
    fullName: string;
    phone: string;
};

function splitFullName(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const formatNamePart = (value: string) =>
        value ? value.charAt(0).toLocaleUpperCase() + value.slice(1) : "";
    const firstName = formatNamePart(parts[0] ?? "");
    const lastName = formatNamePart(parts.slice(1).join(""));

    return { firstName, lastName };
}

function normalizePhone(phone: string) {
    const normalized = phone.replace(/[\s()-]/g, "");

    if (/^0\d{9}$/.test(normalized)) {
        return `+421${normalized.slice(1)}`;
    }

    return normalized;
}

export function OnboardingPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
}: OnboardingPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [submitError, setSubmitError] = useState("");

    const formSchema = z.object({
        fullName: z.string().refine(
            (value) => {
                const { firstName, lastName } = splitFullName(value);
                return !!firstName && !!lastName;
            },
            { message: t("onboarding.requiredError") }
        ),
        phone: z
            .string()
            .refine(
                (value) => /^\+[1-9]\d{1,14}$/.test(normalizePhone(value)),
                { message: t("onboarding.phoneError") }
            ),
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { fullName: "", phone: "" },
    });

    useEffect(() => {
        let isMounted = true;

        apiFetch<CurrentUser>("/users/me")
            .then((user) => {
                if (!isMounted) return;
                if (hasCompletedOnboarding(user)) {
                    navigate("/passenger", { replace: true });
                    return;
                }

                const name =
                    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    user.name ||
                    "";
                reset({ fullName: name, phone: user.phone ?? "" });
            })
            .catch(() => {
                if (isMounted) {
                    setSubmitError(t("onboarding.loginRequired"));
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingProfile(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [navigate, reset, t]);

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        setSubmitError("");
        const { firstName, lastName } = splitFullName(values.fullName);
        const phone = normalizePhone(values.phone);

        const parsed = OnboardingUserBodySchema.safeParse({
            firstName,
            lastName,
            phone,
        });
        if (!parsed.success) {
            setSubmitError(t("onboarding.error"));
            return;
        }

        try {
            await apiFetch("/users/me/onboarding", {
                method: "PATCH",
                body: JSON.stringify(parsed.data),
            });
            navigate("/passenger");
        } catch (error) {
            setSubmitError(
                error instanceof Error ? error.message : t("onboarding.error")
            );
        }
    };

    const inputClass =
        "w-full rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) px-4 py-3 text-sm outline-none focus:border-(--color-primary) transition-colors";

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

            <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
                {!isLoadingProfile && (
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        noValidate
                        className="w-full max-w-xl rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-xl sm:p-8"
                    >
                        <h1 className="text-2xl font-bold text-(--color-text-primary)">
                            {t("onboarding.title")}
                        </h1>
                        <p className="mt-2 text-sm text-(--color-text-secondary)">
                            {t("onboarding.subtitle")}
                        </p>

                        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-(--color-text-primary)">
                                    {t("onboarding.fullName")}
                                </span>
                                <input
                                    className={inputClass}
                                    autoComplete="name"
                                    {...register("fullName")}
                                />
                                {errors.fullName && (
                                    <span className="text-xs font-semibold text-red-500">
                                        {errors.fullName.message}
                                    </span>
                                )}
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-(--color-text-primary)">
                                    {t("onboarding.phone")}
                                </span>
                                <input
                                    className={inputClass}
                                    type="tel"
                                    autoComplete="tel"
                                    {...register("phone")}
                                />
                                {errors.phone && (
                                    <span className="text-xs font-semibold text-red-500">
                                        {errors.phone.message}
                                    </span>
                                )}
                            </label>
                        </div>

                        {submitError && (
                            <p className="mt-5 text-sm font-semibold text-red-500">
                                {submitError}
                            </p>
                        )}

                        <div className="mt-8 flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {t("onboarding.save")}
                            </Button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}
