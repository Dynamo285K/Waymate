import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    createFileRoute,
    useNavigate,
    useLocation,
} from "@tanstack/react-router";
import { Input, Button, Textarea } from "@waymate/ui";
import { FieldError } from "../../components/shared/FieldError";
import { DriverNavbar } from "../../components/navigation/DriverNavbar";
import { PassengerNavbar } from "../../components/navigation/PassengerNavbar";
import { useDriverNavbarProps } from "../../features/driver/hooks/useDriverNavbarProps";
import { usePassengerNavbarProps } from "../../hooks/shared/usePassengerNavbarProps";
import { updateCurrentUserProfile } from "../../lib/auth";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { getErrorI18nKey } from "../../lib/api-errors";
import {
    BIO_MAX_LENGTH,
    NAME_MAX_LENGTH,
    phoneField,
} from "@repo/shared/validation";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

const profileFormSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, "editProfile.firstNameRequired")
        .max(NAME_MAX_LENGTH, "editProfile.nameTooLong"),
    lastName: z
        .string()
        .trim()
        .min(1, "editProfile.lastNameRequired")
        .max(NAME_MAX_LENGTH, "editProfile.nameTooLong"),
    phone: z.string().trim().pipe(phoneField("editProfile.phoneInvalid")),
    about: z.string().trim().max(BIO_MAX_LENGTH, "editProfile.aboutTooLong"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfilePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const role = location.state.role ?? "passenger";
    const backPath =
        role === "driver" ? "/driver/profile" : "/passenger/profile";

    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        // `values` keeps the form in sync with the session without a
        // reset()-in-effect — RHF re-applies these whenever `user` resolves.
        values: {
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            phone: user?.phone ?? "",
            about: user?.bio ?? "",
        },
    });

    const updateProfile = useMutation({
        mutationFn: updateCurrentUserProfile,
        onSuccess: () => {
            authClient.$store.notify("$sessionSignal");
            navigate({ to: backPath });
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <Input
                                label={t("editProfile.firstName")}
                                {...register("firstName")}
                                autoComplete="given-name"
                            />
                            <FieldError>
                                {errors.firstName?.message &&
                                    t(errors.firstName.message)}
                            </FieldError>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Input
                                label={t("editProfile.lastName")}
                                {...register("lastName")}
                                autoComplete="family-name"
                            />
                            <FieldError>
                                {errors.lastName?.message &&
                                    t(errors.lastName.message)}
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

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate({ to: backPath })}
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

export const Route = createFileRoute("/profile/edit")({
    beforeLoad: requireAudience(["user"]),
    component: EditProfilePage,
});
