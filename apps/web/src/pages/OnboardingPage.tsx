import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AuthNavbar, Button } from "waymate-ui";
import type { Language } from "waymate-ui";
import { apiFetch } from "../lib/api";

type OnboardingPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

type CurrentUser = {
    name: string;
    emailVerified: boolean;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
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
    return phone.replace(/[\s()-]/g, "");
}

export function OnboardingPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
}: OnboardingPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [emailVerified, setEmailVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;

        apiFetch<CurrentUser>("/users/me")
            .then((user) => {
                if (!isMounted) return;
                const name =
                    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    user.name ||
                    "";
                setEmailVerified(user.emailVerified);
                setFullName(name);
                setPhone(user.phone ?? "");
                if (!user.emailVerified) {
                    setMessage(t("onboarding.verifyEmailFirst"));
                }
            })
            .catch(() => {
                if (isMounted) {
                    setMessage(t("onboarding.loginRequired"));
                }
            });

        return () => {
            isMounted = false;
        };
    }, [t]);

    async function handleSubmit() {
        setMessage("");
        const { firstName, lastName } = splitFullName(fullName);
        const normalizedPhone = normalizePhone(phone);

        if (!emailVerified) {
            setMessage(t("onboarding.verifyEmailFirst"));
            return;
        }

        if (!firstName || !lastName || !normalizedPhone) {
            setMessage(t("onboarding.requiredError"));
            return;
        }

        if (!/^\+[1-9]\d{1,14}$/.test(normalizedPhone)) {
            setMessage(t("onboarding.phoneError"));
            return;
        }

        setIsSubmitting(true);
        try {
            await apiFetch("/users/me/onboarding", {
                method: "PATCH",
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone: normalizedPhone,
                }),
            });
            navigate("/passenger");
        } catch (error) {
            setMessage(
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
            <AuthNavbar
                language={language}
                onLanguageChange={onLanguageChange}
                theme={theme}
                onThemeToggle={onThemeToggle}
                onLogoClick={() => navigate("/")}
            />

            <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
                <section className="w-full max-w-xl rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-xl sm:p-8">
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
                                value={fullName}
                                onChange={(event) =>
                                    setFullName(event.target.value)
                                }
                                autoComplete="name"
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

                    {message && (
                        <p className="mt-5 text-sm font-semibold text-red-500">
                            {message}
                        </p>
                    )}

                    <div className="mt-8 flex justify-end">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !emailVerified}
                        >
                            {t("onboarding.save")}
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    );
}
