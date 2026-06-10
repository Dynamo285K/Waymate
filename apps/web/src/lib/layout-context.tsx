import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import i18n from "../i18n";
import type { Language } from "../components/controls/LanguageSwitcher";
import { toI18nLanguage } from "./language";
import {
    LayoutContext,
    type LayoutContextValue,
    type Theme,
} from "./use-layout";

const THEME_STORAGE_KEY = "waymate-theme";

function getInitialTheme(): Theme {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const value = useMemo<LayoutContextValue>(
        () => ({
            language,
            theme,
            onLanguageChange: (lang) => {
                const i18nLanguage = toI18nLanguage(lang);
                setLanguage(i18nLanguage as Language);
                i18n.changeLanguage(i18nLanguage);
            },
            onThemeToggle: () =>
                setTheme((current) => (current === "light" ? "dark" : "light")),
        }),
        [language, theme]
    );

    return (
        <LayoutContext.Provider value={value}>
            {children}
        </LayoutContext.Provider>
    );
}
