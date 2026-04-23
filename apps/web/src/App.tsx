import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
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

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <HomePage
                        {...sharedProps}
                        onLogin={() => navigate("/login")}
                        onRegister={() => navigate("/register")}
                        onLogoClick={() => navigate("/")}
                    />
                }
            />
            <Route path="/login" element={<LoginPage {...sharedProps} />} />
            <Route path="/register" element={<RegisterPage {...sharedProps} />} />
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
