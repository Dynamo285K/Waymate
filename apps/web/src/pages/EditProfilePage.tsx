import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "../lib/router-compat";
import { Input, Button, Textarea } from "@waymate/ui";
import { FieldError } from "../components/FieldError";
import type { Language } from "../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../components/navigation/DriverNavbar";
import { PassengerNavbar } from "../components/navigation/PassengerNavbar";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { usePassengerNavbarProps } from "../hooks/usePassengerNavbarProps";
import { useGetUsersMe } from "../api-client/users/users";
import { CURRENT_USER_QUERY_KEY, updateCurrentUserProfile } from "../lib/auth";
import { getErrorI18nKey } from "../lib/api-errors";
import {
    BIO_MAX_LENGTH,
    NAME_MAX_LENGTH,
    phoneField,
} from "@repo/shared/validation";

type EditProfilePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

// `fullName` is split into first/last name before being sent to the API,
// where each part is validated by the shared CapitalizedNameSchema. Checking
// the split parts here surfaces an over-long name as an inline field error
// instead of a server-side rejection.
const profileFormSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(1, "editProfile.fullNameRequired")
        .superRefine((value, ctx) => {
            const { firstName, lastName } = splitFullName(value);
            if (
                (firstName ?? "").length > NAME_MAX_LENGTH ||
                (lastName ?? "").length > NAME_MAX_LENGTH
            ) {
                ctx.addIssue({
                    code: "custom",
                    message: "editProfile.nameTooLong",
                });
            }
        }),
    phone: z.string().trim().pipe(phoneField("editProfile.phoneInvalid")),
    about: z.string().trim().max(BIO_MAX_LENGTH, "editProfile.aboutTooLong"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfilePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: EditProfilePageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const location = useLocation();
    const role =
        (location.state as { role?: "passenger" | "driver" } | null)?.role ??
        "passenger";
    const backPath =
        role === "driver" ? "/driver/profile" : "/passenger/profile";

    const { data: currentUser } = useGetUsersMe({ query: { retry: false } });

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        // Profile props arrive asynchronously (after the current-user query
        // resolves). `values` re-syncs them without a reset()-in-effect that
        // would clobber in-progress edits on a background refetch.
        values: {
            fullName: userName ?? "",
            phone: userPhone ?? "",
            about: userBio ?? "",
        },
    });

    const updateProfile = useMutation({
        mutationFn: updateCurrentUserProfile,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: CURRENT_USER_QUERY_KEY,
            });
            navigate(backPath);
        },
    });

    const onSubmit: SubmitHandler<ProfileFormValues> = (values) => {
        updateProfile.mutate({
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            displayName: values.firstName.trim(),
            phone: values.phone.trim(),
            bio: values.about.trim(),
        });
    };

    const driverNavbarProps = useDriverNavbarProps({
        activeTab: undefined,
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const passengerNavbarProps = usePassengerNavbarProps({
        activeTab: "find-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            {role === "driver" ? (
                <DriverNavbar {...driverNavbarProps} />
            ) : (
                <PassengerNavbar {...passengerNavbarProps} />
            )}

            <section className="w-full px-4 sm:max-w-2xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-8">
                    {t("editProfile.title")}
                </h1>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="bg-(--color-card) rounded-2xl p-6 sm:p-8 border border-(--color-border) flex flex-col gap-6"
                >
                    {/* Two-column grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <Input
                                label={t("editProfile.firstName")}
                                {...register("firstName")}
                                autoComplete="given-name"
                            />
                            <FieldError>
                                {errors.fullName?.message &&
                                    t(errors.fullName.message)}
                            </FieldError>
                        </div>
                        <Input
                            label={t("editProfile.email")}
                            type="email"
                            value={userEmail ?? ""}
                            disabled
                            onChange={() => {}}
                        />
                        <div className="flex flex-col gap-1">
                            <Input
                                label={t("editProfile.phone")}
                                {...register("phone")}
                                autoComplete="tel"
                            />
                            <FieldError>
                                {errors.phone?.message &&
                                    t(errors.phone.message)}
                            </FieldError>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-(--color-text-primary)">
                            {t("editProfile.aboutMe")}
                        </label>
                        <Controller
                            control={control}
                            name="about"
                            render={({ field }) => (
                                <Textarea
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        <FieldError>
                            {errors.about?.message && t(errors.about.message)}
                        </FieldError>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(backPath)}
                        >
                            {t("editProfile.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || updateProfile.isPending}
                        >
                            {updateProfile.isPending
                                ? t("editProfile.saving")
                                : t("editProfile.save")}
                        </Button>
                    </div>

                    {updateProfile.isError && (
                        <FieldError>
                            {t(
                                getErrorI18nKey(
                                    updateProfile.error,
                                    {},
                                    "editProfile.saveError"
                                )
                            )}
                        </FieldError>
                    )}
                </form>
            </section>
        </div>
    );
}
