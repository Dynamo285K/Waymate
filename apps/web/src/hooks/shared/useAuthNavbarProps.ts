import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import type { Language } from "../../components/controls/LanguageSwitcher";
import { toUiLanguage } from "../../lib/language";

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
        onLogin: params.onLogin ?? (() => navigate({ to: "/login" })),
        onRegister: params.onRegister ?? (() => navigate({ to: "/register" })),
        onLogoClick: params.onLogoClick ?? (() => navigate({ to: "/" })),
        labels: {
            login: t("home.navbar.login"),
            register: t("home.navbar.register"),
        },
    };
}
