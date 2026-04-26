import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { RidesPage } from "./pages/RidesPage";
import { PassengerHomePage } from "./pages/PassengerHomePage";
import { PassengerChatPage } from "./pages/PassengerChatPage";
import { PassengerRidesPage } from "./pages/PassengerRidesPage";
import { PassengerMyRidesPage } from "./pages/PassengerMyRidesPage";
import { PassengerProfilePage } from "./pages/PassengerProfilePage";
import { PassengerRatingsPage } from "./pages/PassengerRatingsPage";
import { DriverHomePage } from "./pages/DriverHomePage";
import { DriverChatPage } from "./pages/DriverChatPage";
import { DriverMyRidesPage } from "./pages/DriverMyRidesPage";
import { DriverPassengersPage } from "./pages/DriverPassengersPage";
import { DriverRatePassengersPage } from "./pages/DriverRatePassengersPage";
import { DriverOfferRidePage } from "./pages/DriverOfferRidePage";
import { DriverRideRequestsPage } from "./pages/DriverRideRequestsPage";
import { DriverProfilePage } from "./pages/DriverProfilePage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { AddCarPage } from "./pages/AddCarPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { DriverRatingsPage } from "./pages/DriverRatingsPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminRidesPage } from "./pages/AdminRidesPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminReportsPage } from "./pages/AdminReportsPage";
import { AdminAccountPage } from "./pages/AdminAccountPage";
import i18n from "./i18n";
import type { Language } from "waymate-ui";

function AppRoutes() {
    const [language, setLanguage] = useState<Language>("en");
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const navigate = useNavigate();

    function handleLanguageChange(lang: Language) {
        setLanguage(lang);
        i18n.changeLanguage(lang);
    }

    function handleThemeToggle() {
        setTheme((t) => (t === "light" ? "dark" : "light"));
    }

    const sharedProps = {
        language,
        theme,
        onLanguageChange: handleLanguageChange,
        onThemeToggle: handleThemeToggle,
    };

    const navProps = {
        onLogin: () => navigate("/login"),
        onRegister: () => navigate("/register"),
        onLogoClick: () => navigate("/"),
    };

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <HomePage
                        {...sharedProps}
                        {...navProps}
                        onSearch={(from, to) => {
                            const params = new URLSearchParams();
                            if (from) params.set("from", from);
                            if (to) params.set("to", to);
                            navigate(`/rides?${params.toString()}`);
                        }}
                        onViewAllRides={() => navigate("/rides")}
                    />
                }
            />
            <Route
                path="/rides"
                element={
                    <RidesPage
                        {...sharedProps}
                        {...navProps}
                    />
                }
            />
            <Route
                path="/passenger"
                element={<PassengerHomePage {...sharedProps} />}
            />
            <Route
                path="/passenger/rides"
                element={<PassengerMyRidesPage {...sharedProps} />}
            />
            <Route
                path="/passenger/rides/search"
                element={<PassengerRidesPage {...sharedProps} />}
            />
            <Route
                path="/passenger/chat"
                element={<PassengerChatPage {...sharedProps} />}
            />
            <Route
                path="/passenger/profile"
                element={<PassengerProfilePage {...sharedProps} />}
            />
            <Route
                path="/passenger/ratings"
                element={<PassengerRatingsPage {...sharedProps} />}
            />
            <Route
                path="/driver"
                element={<DriverHomePage {...sharedProps} />}
            />
            <Route
                path="/driver/chat"
                element={<DriverChatPage {...sharedProps} />}
            />
            <Route
                path="/driver/rides"
                element={<DriverMyRidesPage {...sharedProps} />}
            />
            <Route
                path="/driver/rides/passengers"
                element={<DriverPassengersPage {...sharedProps} />}
            />
            <Route
                path="/driver/rides/rate"
                element={<DriverRatePassengersPage {...sharedProps} />}
            />
            <Route
                path="/driver/offer"
                element={<DriverOfferRidePage {...sharedProps} />}
            />
            <Route
                path="/driver/requests"
                element={<DriverRideRequestsPage {...sharedProps} />}
            />
            <Route
                path="/driver/profile"
                element={<DriverProfilePage {...sharedProps} />}
            />
            <Route
                path="/driver/ratings"
                element={<DriverRatingsPage {...sharedProps} />}
            />
            <Route
                path="/profile/edit"
                element={<EditProfilePage {...sharedProps} />}
            />
            <Route
                path="/car/add"
                element={<AddCarPage {...sharedProps} />}
            />
            <Route
                path="/admin"
                element={<AdminDashboardPage {...sharedProps} />}
            />
            <Route
                path="/admin/rides"
                element={<AdminRidesPage {...sharedProps} />}
            />
            <Route
                path="/admin/users"
                element={<AdminUsersPage {...sharedProps} />}
            />
            <Route
                path="/admin/reports"
                element={<AdminReportsPage {...sharedProps} />}
            />
            <Route
                path="/admin/account"
                element={<AdminAccountPage {...sharedProps} />}
            />
            <Route
                path="/login"
                element={<LoginPage {...sharedProps} />}
            />
            <Route
                path="/forgot-password"
                element={<ForgotPasswordPage {...sharedProps} />}
            />
            <Route
                path="/register"
                element={<RegisterPage {...sharedProps} />}
            />
            <Route
                path="/onboarding"
                element={<OnboardingPage {...sharedProps} />}
            />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}
