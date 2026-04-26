import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import {
    PassengerNavbar,
    DriverNavbar,
    AdminNavbar,
    Input,
    Button,
} from "waymate-ui";
import type { Language } from "waymate-ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";

type EditProfilePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function EditProfilePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName = "Tomáš Olbert",
    userEmail = "nejviacpracujuci@gmail.com",
}: EditProfilePageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
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

    const [name, setName] = useState(userName);
    const [email, setEmail] = useState(userEmail);
    const [phone, setPhone] = useState("+421 900 123 456");
    const [plate, setPlate] = useState("BA-123AB");
    const [about, setAbout] = useState(
        "Easygoing traveler who enjoys meeting new people on the road. Reliable, communicative, and always respectful during rides."
    );

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
                    onLogoutClick={() => navigate("/")}
                    labels={{
                        adminRole: t("admin.adminRole"),
                        dashboard: t("admin.dashboard"),
                        rides: t("admin.rides"),
                        users: t("admin.users"),
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
                    onLogoutClick={() => navigate("/")}
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
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            label={t("editProfile.phone")}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <Input
                            label={t("editProfile.licensePlate")}
                            value={plate}
                            onChange={(e) => setPlate(e.target.value)}
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
                            variant="secondary"
                            onClick={() => navigate(backPath)}
                        >
                            {t("editProfile.cancel")}
                        </Button>
                        <Button onClick={() => navigate(backPath)}>
                            {t("editProfile.save")}
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
