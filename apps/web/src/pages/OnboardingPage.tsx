import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AuthNavbar, Button } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useAuthNavbarProps } from "../hooks/useAuthNavbarProps";
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

function formatNamePart(value: string) {
    const trimmed = value.trim();
    return trimmed
        ? trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1)
        : "";
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
    const authNavbarProps = useAuthNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
    });
    const queryClient = useQueryClient();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        let isMounted = true;

        apiFetch<CurrentUser>("/users/me")
            .then((user) => {
                if (!isMounted) return;
                if (hasCompletedOnboarding(user)) {
                    navigate("/passenger", { replace: true });
                    return;
                }

                setFirstName(user.firstName ?? "");
                setLastName(user.lastName ?? "");
                setPhone(user.phone ?? "");
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
    }, [navigate, t]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitError("");

        const formattedFirstName = formatNamePart(firstName);
        const formattedLastName = formatNamePart(lastName);
        const normalizedPhone = normalizePhone(phone);

        if (!formattedFirstName || !formattedLastName || !normalizedPhone) {
            setSubmitError(t("onboarding.requiredError"));
            return;
        }

        if (!/^\+[1-9]\d{1,14}$/.test(normalizedPhone)) {
            setSubmitError(t("onboarding.phoneError"));
            return;
        }

        setIsSubmitting(true);
        try {
            const updatedUser = await apiFetch<CurrentUser>(
                "/users/me/onboarding",
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        firstName: formattedFirstName,
                        lastName: formattedLastName,
                        phone: normalizedPhone,
                    }),
                }
            );
            queryClient.setQueryData(["users", "me"], updatedUser);
            await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
            navigate("/passenger");
        } catch (error) {
            setSubmitError(
                error instanceof Error ? error.message : t("onboarding.error")
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    const inputClass =
        "w-full rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) px-4 py-3 text-sm outline-none focus:border-(--color-primary) transition-colors";

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AuthNavbar {...authNavbarProps} />

            <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
                {!isLoadingProfile && (
                    <form
                        onSubmit={handleSubmit}
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
                                    {t("onboarding.firstName")}
                                </span>
                                <input
                                    className={inputClass}
                                    value={firstName}
                                    onChange={(event) =>
                                        setFirstName(event.target.value)
                                    }
                                    autoComplete="given-name"
                                />
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-(--color-text-primary)">
                                    {t("onboarding.lastName")}
                                </span>
                                <input
                                    className={inputClass}
                                    value={lastName}
                                    onChange={(event) =>
                                        setLastName(event.target.value)
                                    }
                                    autoComplete="family-name"
                                />
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-(--color-text-primary)">
                                    {t("onboarding.phone")}
                                </span>
                                <input
                                    className={inputClass}
                                    value={phone}
                                    onChange={(event) =>
                                        setPhone(event.target.value)
                                    }
                                    type="tel"
                                    autoComplete="tel"
                                />
                            </label>
                        </div>

                        {submitError && (
                            <p className="mt-5 text-sm font-semibold text-(--color-red)">
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
