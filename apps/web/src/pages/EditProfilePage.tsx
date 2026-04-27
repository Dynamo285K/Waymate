import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

type EditProfilePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type FormValues = {
    name: string;
    email: string;
    phone: string;
    plate: string;
    about: string;
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

    const formSchema = z.object({
        name: z.string().trim().min(1, t("register.requiredError")),
        email: z
            .string()
            .trim()
            .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
                message: t("login.invalidEmail"),
            }),
        phone: z.string(),
        plate: z.string(),
        about: z.string().max(500),
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: userName,
            email: userEmail,
            phone: "+421 900 123 456",
            plate: "BA-123AB",
            about: "Easygoing traveler who enjoys meeting new people on the road. Reliable, communicative, and always respectful during rides.",
        },
    });

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

    const onSubmit: SubmitHandler<FormValues> = () => {
        navigate(backPath);
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

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="bg-(--color-card) rounded-2xl p-6 sm:p-8 border border-(--color-border) flex flex-col gap-6"
                >
                    {/* Two-column grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label={t("editProfile.fullName")}
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs font-semibold text-red-500">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <Input
                                label={t("editProfile.email")}
                                type="email"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs font-semibold text-red-500">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                        <Input
                            label={t("editProfile.phone")}
                            {...register("phone")}
                        />
                        <Input
                            label={t("editProfile.licensePlate")}
                            {...register("plate")}
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
                                {...register("about")}
                            />
                            {errors.about && (
                                <p className="text-xs font-semibold text-red-500">
                                    {errors.about.message}
                                </p>
                            )}
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
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {t("editProfile.save")}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
