import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "../lib/router-compat";
import { Input, Button, Textarea } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../components/navigation/DriverNavbar";
import { PassengerNavbar } from "../components/navigation/PassengerNavbar";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { usePassengerNavbarProps } from "../hooks/usePassengerNavbarProps";
import { CURRENT_USER_QUERY_KEY, updateCurrentUserProfile } from "../lib/auth";
import { getErrorI18nKey } from "../lib/api-errors";

type EditProfilePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    userBio?: string;
};

export function EditProfilePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
    userPhone,
    userBio,
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

    const [name, setName] = useState(userName ?? "");
    const [email, setEmail] = useState(userEmail ?? "");
    const [phone, setPhone] = useState(userPhone ?? "");
    const [about, setAbout] = useState(userBio ?? "");
    const [prevProfile, setPrevProfile] = useState({
        userName,
        userEmail,
        userPhone,
        userBio,
    });

    if (
        prevProfile.userName !== userName ||
        prevProfile.userEmail !== userEmail ||
        prevProfile.userPhone !== userPhone ||
        prevProfile.userBio !== userBio
    ) {
        setPrevProfile({ userName, userEmail, userPhone, userBio });
        if (userName) setName(userName);
        if (userEmail) setEmail(userEmail);
        if (userPhone) setPhone(userPhone);
        if (userBio) setAbout(userBio);
    }

    const updateProfile = useMutation({
        mutationFn: updateCurrentUserProfile,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: CURRENT_USER_QUERY_KEY,
            });
            navigate(backPath);
        },
    });

    function handleSave() {
        const { firstName, lastName } = splitFullName(name);

        updateProfile.mutate({
            firstName,
            lastName,
            displayName: firstName,
            phone: phone.trim(),
            bio: about.trim(),
        });
    }

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

                <div className="bg-(--color-card) rounded-2xl p-6 sm:p-8 border border-(--color-border) flex flex-col gap-6">
                    {/* Two-column grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label={t("editProfile.fullName")}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            label={t("editProfile.email")}
                            type="email"
                            value={email}
                            disabled
                            onChange={() => {}}
                        />
                        <Input
                            label={t("editProfile.phone")}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-(--color-text-primary)">
                            {t("editProfile.aboutMe")}
                        </label>
                        <Textarea
                            value={about}
                            onChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>
                            ) => setAbout(e.target.value)}
                        />
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
                            onClick={handleSave}
                            disabled={updateProfile.isPending}
                        >
                            {updateProfile.isPending
                                ? t("editProfile.saving")
                                : t("editProfile.save")}
                        </Button>
                    </div>

                    {updateProfile.isError && (
                        <p className="text-sm font-semibold text-(--color-danger-text)">
                            {t(
                                getErrorI18nKey(
                                    updateProfile.error,
                                    {},
                                    "editProfile.saveError"
                                )
                            )}
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}

function splitFullName(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const formatNamePart = (value: string) =>
        value ? value.charAt(0).toLocaleUpperCase() + value.slice(1) : "";
    const firstName = formatNamePart(parts[0] ?? "");
    const lastName = formatNamePart(parts.slice(1).join(""));

    return {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
    };
}
