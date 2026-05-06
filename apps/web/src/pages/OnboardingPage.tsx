import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AuthNavbar, Button } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { useAuthNavbarProps } from "../hooks/useAuthNavbarProps";
import {
    useGetUsersMe,
    usePatchUsersMeOnboarding,
} from "../api-client/users/users";
import type { ApiMutationError } from "../lib/api-fetcher";
import { getErrorI18nKey } from "../lib/api-errors";
import {
    CURRENT_USER_QUERY_KEY,
    getPostAuthPath,
    hasCompletedOnboarding,
} from "../lib/auth";

type OnboardingPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
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
    const [isInitialized, setIsInitialized] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const {
        data: user,
        isPending: isLoadingProfile,
        error: loadError,
    } = useGetUsersMe({
        query: { retry: false },
    });

    const onboardMutation = usePatchUsersMeOnboarding<ApiMutationError>({
        mutation: {
            onSuccess: (updatedUser) => {
                queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser);
            },
        },
    });

    useEffect(() => {
        if (isInitialized || isLoadingProfile) return;

        if (loadError) {
            setSubmitError("onboarding.loginRequired");
            setIsInitialized(true);
            return;
        }

        if (!user) return;

        if (hasCompletedOnboarding(user)) {
            let cancelled = false;
            getPostAuthPath().then((path) => {
                if (!cancelled) navigate(path, { replace: true });
            });
            return () => {
                cancelled = true;
            };
        }

        setFirstName(user.firstName ?? "");
        setLastName(user.lastName ?? "");
        setPhone(user.phone ?? "");
        setIsInitialized(true);
    }, [user, loadError, isLoadingProfile, isInitialized, navigate, t]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitError("");

        const formattedFirstName = formatNamePart(firstName);
        const formattedLastName = formatNamePart(lastName);
        const normalizedPhone = normalizePhone(phone);

        if (!formattedFirstName || !formattedLastName || !normalizedPhone) {
            setSubmitError("onboarding.requiredError");
            return;
        }

        if (!/^\+[1-9]\d{1,14}$/.test(normalizedPhone)) {
            setSubmitError("onboarding.phoneError");
            return;
        }

        try {
            await onboardMutation.mutateAsync({
                data: {
                    firstName: formattedFirstName,
                    lastName: formattedLastName,
                    phone: normalizedPhone,
                },
            });
            navigate(await getPostAuthPath());
        } catch (error) {
            console.error("Onboarding submit failed", error);
            setSubmitError(getErrorI18nKey(error, {}, "onboarding.error"));
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
                {isInitialized && (
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
                                {t(submitError)}
                            </p>
                        )}

                        <div className="mt-8 flex justify-end">
                            <Button
                                type="submit"
                                disabled={onboardMutation.isPending}
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
