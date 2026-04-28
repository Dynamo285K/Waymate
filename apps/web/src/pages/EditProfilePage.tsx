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
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { useLogout } from "../hooks/useLogout";
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
    const logout = useLogout();
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

    const passengerNavbarLabels = {
        passenger: t("roles.passenger"),
        driver: t("roles.driver"),
        findRide: t("nav.findRide"),
        myRides: t("nav.myRides"),
        chat: t("nav.chat"),
        profile: t("nav.profile"),
        dropdownMyRides: t("nav.myRides"),
        messages: t("nav.messages"),
        ratings: t("nav.ratings"),
        settings: t("nav.settings"),
        logout: t("nav.logout"),
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            {role === "driver" ? (
                <DriverNavbar {...driverNavbarProps} />
            ) : role === "admin" ? (
                <AdminNavbar
                    language={language}
                    onLanguageChange={onLanguageChange}
                    theme={theme}
                    onThemeToggle={onThemeToggle}
                    userName={userName}
                    userEmail={userEmail}
                    onLogoClick={() => navigate("/admin")}
                    onDashboardClick={() => navigate("/admin")}
                    onRidesClick={() => navigate("/admin/rides")}
                    onUsersClick={() => navigate("/admin/users")}
                    onReportsClick={() => navigate("/admin/reports")}
                    onProfileClick={() => navigate("/admin/account")}
                    onLogoutClick={logout}
                    labels={{
                        adminRole: t("admin.adminRole"),
                        dashboard: t("admin.dashboard"),
                        users: t("admin.users"),
                        rides: t("admin.rides"),
                        reports: t("admin.reports"),
                        account: t("admin.account"),
                        settings: t("admin.settings"),
                        logout: t("admin.logout"),
                    }}
                />
            ) : (
                <PassengerNavbar
                    activeTab="find-ride"
                    language={language}
                    onLanguageChange={onLanguageChange}
                    role="passenger"
                    onRoleChange={(r) => r === "driver" && navigate("/driver")}
                    theme={theme}
                    onThemeToggle={onThemeToggle}
                    userName={userName}
                    userEmail={userEmail}
                    onLogoClick={() => navigate("/passenger")}
                    onFindRideClick={() => navigate("/passenger")}
                    onMyRidesClick={() => navigate("/passenger/rides")}
                    onChatClick={() => navigate("/passenger/chat")}
                    onMessagesClick={() => navigate("/passenger/chat")}
                    onProfileClick={() => navigate("/passenger/profile")}
                    onRatingsClick={() => navigate("/passenger/ratings")}
                    onLogoutClick={logout}
                    labels={passengerNavbarLabels}
                />
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
