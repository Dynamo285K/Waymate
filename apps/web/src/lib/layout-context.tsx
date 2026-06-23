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
const LANGUAGE_STORAGE_KEY = "waymate-language";

function getInitialTheme(): Theme {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function getInitialLanguage(): Language {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    // State stores i18n codes: "en", "sk", "cs" (not UI code "cz")
    const lang: Language =
        stored === "en" || stored === "sk" || stored === "cs"
            ? (stored as Language)
            : "en";
    // Call synchronously so i18n is set before any child renders
    void i18n.changeLanguage(lang);
    return lang;
}

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(getInitialLanguage);
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        document.documentElement.dataset.theme = theme;
        document.body.dataset.theme = theme;
    }, [theme]);

    useEffect(() => {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        i18n.changeLanguage(toI18nLanguage(language));
    }, [language]);

    const value = useMemo<LayoutContextValue>(
        () => ({
            language,
            theme,
            onLanguageChange: (lang) => {
                setLanguage(toI18nLanguage(lang) as Language);
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
