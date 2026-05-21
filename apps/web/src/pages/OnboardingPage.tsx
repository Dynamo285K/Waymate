import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AuthNavbar, Button, Input } from "@waymate/ui";
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

const onboardingSchema = z.object({
    firstName: z.string().min(1, "onboarding.requiredError"),
    lastName: z.string().min(1, "onboarding.requiredError"),
    phone: z
        .string()
        .min(1, "onboarding.requiredError")
        .refine(
            (val) => /^\+[1-9]\d{1,14}$/.test(normalizePhone(val)),
            "onboarding.phoneError"
        ),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

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
    const [isInitialized, setIsInitialized] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: { firstName: "", lastName: "", phone: "" },
    });

    const {
        data: user,
        isPending: isLoadingProfile,
        error: loadError,
    } = useGetUsersMe({
        query: { retry: false },
    });

    const alreadyOnboarded = !!user && hasCompletedOnboarding(user);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<OnboardingFormInput, unknown, OnboardingFormValues>({
        resolver: zodResolver(onboardingFormSchema),
        // `values` keeps the form in sync with the async profile query without
        // a reset()-in-effect — RHF re-applies these whenever `user` resolves.
        values: {
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            phone: user?.phone ?? "",
        },
    });

    const onboardMutation = usePatchUsersMeOnboarding<ApiMutationError>({
        mutation: {
            onSuccess: (updatedUser) => {
                queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser);
            },
        },
    });

    // Redirect away once we know the user has already onboarded. No setState
    // here, so it doesn't trigger set-state-in-effect.
    useEffect(() => {
        if (isInitialized || isLoadingProfile) return;

        if (loadError) {
            setSubmitError(t("onboarding.loginRequired"));
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

        reset({
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            phone: user.phone ?? "",
        });
        setIsInitialized(true);
    }, [user, loadError, isLoadingProfile, isInitialized, navigate, t, reset]);

    async function onSubmit(values: OnboardingFormValues) {
        setSubmitError("");
        try {
            await onboardMutation.mutateAsync({
                data: {
                    firstName: formatNamePart(values.firstName),
                    lastName: formatNamePart(values.lastName),
                    phone: normalizePhone(values.phone),
                },
            });
            navigate(await getPostAuthPath());
        } catch (error) {
            console.error("Onboarding submit failed", error);
            setError("root", {
                message: getErrorI18nKey(error, {}, "onboarding.error"),
            });
        }
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AuthNavbar {...authNavbarProps} />

            <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
                {!isLoadingProfile && !alreadyOnboarded && (
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
                                    {t("onboarding.firstName")}
                                </span>
                                <Input
                                    {...register("firstName")}
                                    autoComplete="given-name"
                                    {...register("firstName")}
                                />
                                {errors.firstName && (
                                    <span className="text-sm font-semibold text-(--color-red)">
                                        {t(errors.firstName.message!)}
                                    </span>
                                )}
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-(--color-text-primary)">
                                    {t("onboarding.lastName")}
                                </span>
                                <Input
                                    {...register("lastName")}
                                    autoComplete="family-name"
                                    {...register("lastName")}
                                />
                                {errors.lastName && (
                                    <span className="text-sm font-semibold text-(--color-red)">
                                        {t(errors.lastName.message!)}
                                    </span>
                                )}
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-(--color-text-primary)">
                                    {t("onboarding.phone")}
                                </span>
                                <Input
                                    {...register("phone")}
                                    autoComplete="tel"
                                    {...register("phone")}
                                />
                                {errors.phone && (
                                    <span className="text-sm font-semibold text-(--color-red)">
                                        {t(errors.phone.message!)}
                                    </span>
                                )}
                            </label>
                        </div>

                        {(errors.root?.message || loadError) && (
                            <p className="mt-5 text-sm font-semibold text-(--color-red)">
                                {t(
                                    errors.root?.message ??
                                        "onboarding.loginRequired"
                                )}
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
