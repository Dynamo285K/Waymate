import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "../lib/router-compat";
import {
    PassengerNavbar,
    DriverNavbar,
    AdminNavbar,
    Input,
    Button,
} from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useAdminNavbarProps } from "../hooks/useAdminNavbarProps";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { usePassengerNavbarProps } from "../hooks/usePassengerNavbarProps";
import { updateCurrentUserProfile } from "../lib/auth";

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
        (location.state as { role?: "passenger" | "driver" | "admin" } | null)
            ?.role ?? "passenger";
    const backPath =
        role === "driver"
            ? "/driver/profile"
            : role === "admin"
              ? "/admin/account"
              : "/passenger/profile";

    const [name, setName] = useState(userName ?? "");
    const [email, setEmail] = useState(userEmail ?? "");
    const [phone, setPhone] = useState(userPhone ?? "");
    const [about, setAbout] = useState(userBio ?? "");

    const updateProfile = useMutation({
        mutationFn: updateCurrentUserProfile,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
            navigate(backPath);
        },
    });

    useEffect(() => {
        if (userName) {
            setName(userName);
        }
    }, [userName]);

    useEffect(() => {
        if (userEmail) {
            setEmail(userEmail);
        }
    }, [userEmail]);

    useEffect(() => {
        if (userPhone) {
            setPhone(userPhone);
        }
    }, [userPhone]);

    useEffect(() => {
        if (userBio) {
            setAbout(userBio);
        }
    }, [userBio]);

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
    const adminNavbarProps = useAdminNavbarProps({
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
            ) : role === "admin" ? (
                <AdminNavbar {...adminNavbarProps} />
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

                    {/* About me textarea — hidden for admin */}
                    {role !== "admin" && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-(--color-text-primary)">
                                {t("editProfile.aboutMe")}
                            </label>
                            <textarea
                                className="w-full rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) p-3 text-sm resize-y min-h-25 outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-green-100 transition-colors font-[Inter,sans-serif]"
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                            />
                        </div>
                    )}

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
                                ? t("editProfile.saving", "Saving...")
                                : t("editProfile.save")}
                        </Button>
                    </div>

                    {updateProfile.isError && (
                        <p className="text-sm font-semibold text-red-500">
                            {t(
                                "editProfile.saveError",
                                "Could not save profile changes."
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
