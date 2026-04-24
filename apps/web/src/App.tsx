import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RidesPage } from "./pages/RidesPage";
import { PassengerHomePage } from "./pages/PassengerHomePage";
import { PassengerChatPage } from "./pages/PassengerChatPage";
import { PassengerRidesPage } from "./pages/PassengerRidesPage";
import { PassengerMyRidesPage } from "./pages/PassengerMyRidesPage";
import { PassengerProfilePage } from "./pages/PassengerProfilePage";
import { PassengerRatingsPage } from "./pages/PassengerRatingsPage";
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
                path="/login"
                element={<LoginPage {...sharedProps} />}
            />
            <Route
                path="/register"
                element={<RegisterPage {...sharedProps} />}
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
