import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import type { Language } from "@waymate/ui";
import { toUiLanguage } from "../lib/language";

export function useAuthNavbarProps(params: {
    language: Language;
    onLanguageChange: (lang: Language) => void;
    theme: "light" | "dark";
    onThemeToggle: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    onLogoClick?: () => void;
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return {
        ...params,
        language: toUiLanguage(params.language),
        onLogin: params.onLogin ?? (() => navigate("/login")),
        onRegister: params.onRegister ?? (() => navigate("/register")),
        onLogoClick: params.onLogoClick ?? (() => navigate("/")),
        labels: {
            login: t("home.navbar.login"),
            register: t("home.navbar.register"),
        },
    };
}
