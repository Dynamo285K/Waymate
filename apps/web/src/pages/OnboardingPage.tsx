import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AuthNavbar, Button, Input } from "@waymate/ui";
import { FieldError } from "../components/FieldError";
import type { Language } from "../components/controls/LanguageSwitcher";
import { useAuthNavbarProps } from "../hooks/useAuthNavbarProps";
import {
    useGetUsersMe,
    usePatchUsersMeOnboarding,
} from "../api-client/users/users";
import type { ApiMutationError } from "../lib/api-fetcher";
import { getErrorI18nKey } from "../lib/api-errors";
import { CURRENT_USER_QUERY_KEY, getPostAuthPath, signOut } from "../lib/auth";
import {
    NAME_MAX_LENGTH,
    NO_WHITESPACE_REGEX,
    phoneField,
} from "@repo/shared/validation";

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

// Names are capitalized and the phone is normalized (0XXX → +421XXX) as part
// of validation, so the values handed to the API are already formatted. The
// post-transform length/format checks mirror the API's CapitalizedNameSchema /
// PhoneSchema (shared rules), so a value that passes here also passes the API.
const nameSchema = z
    .string()
    .trim()
    .min(1, "onboarding.requiredError")
    .transform(formatNamePart)
    .pipe(
        z
            .string()
            .max(NAME_MAX_LENGTH, "onboarding.nameTooLong")
            .regex(NO_WHITESPACE_REGEX, "onboarding.nameNoSpaces")
    );

const onboardingFormSchema = z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    phone: z
        .string()
        .trim()
        .min(1, "onboarding.requiredError")
        .transform(normalizePhone)
        .pipe(phoneField("onboarding.phoneError")),
});

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export function OnboardingPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
}: OnboardingPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    async function handleSwitchAccount(to: "/login" | "/register") {
        await signOut().catch(() => {});
        navigate(to);
    }

    const authNavbarProps = useAuthNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        onLogin: () => handleSwitchAccount("/login"),
        onRegister: () => handleSwitchAccount("/register"),
    });
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<OnboardingFormValues>({
        resolver: zodResolver(onboardingFormSchema),
        defaultValues: { firstName: "", lastName: "", phone: "" },
    });

    const {
        data: user,
        isPending: isLoadingProfile,
        error: loadError,
    } = useGetUsersMe({ query: { retry: false } });

    useEffect(() => {
        if (loadError) {
            setError("root", { message: "onboarding.loginRequired" });
        }
    }, [loadError, setError]);

    useEffect(() => {
        if (isLoadingProfile || !user) return;
        reset({
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            phone: user.phone ?? "",
        });
    }, [user, isLoadingProfile, reset]);

    const onboardMutation = usePatchUsersMeOnboarding<ApiMutationError>({
        mutation: {
            onSuccess: (updatedUser) => {
                queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser);
            },
        },
    });

    async function onSubmit(values: OnboardingFormValues) {
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
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AuthNavbar {...authNavbarProps} />

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
                                    {t("onboarding.firstName")}
                                </span>
                                <Input
                                    {...register("firstName")}
                                    autoComplete="given-name"
                                />
                                <FieldError>
                                    {errors.firstName?.message &&
                                        t(errors.firstName.message)}
                                </FieldError>
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-(--color-text-primary)">
                                    {t("onboarding.lastName")}
                                </span>
                                <Input
                                    {...register("lastName")}
                                    autoComplete="family-name"
                                />
                                <FieldError>
                                    {errors.lastName?.message &&
                                        t(errors.lastName.message)}
                                </FieldError>
                            </label>

                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-(--color-text-primary)">
                                    {t("onboarding.phone")}
                                </span>
                                <Input
                                    {...register("phone")}
                                    autoComplete="tel"
                                />
                                <FieldError>
                                    {errors.phone?.message &&
                                        t(errors.phone.message)}
                                </FieldError>
                            </label>
                        </div>

                        {(errors.root?.message || loadError) && (
                            <FieldError className="mt-5">
                                {t(
                                    errors.root?.message ??
                                        "onboarding.loginRequired"
                                )}
                            </FieldError>
                        )}

                        <div className="mt-8 flex justify-end">
                            <Button
                                type="submit"
                                disabled={
                                    isSubmitting || onboardMutation.isPending
                                }
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
