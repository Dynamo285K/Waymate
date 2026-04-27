import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import i18n from "../i18n";
import type { Language } from "waymate-ui";

export type Theme = "light" | "dark";

export type LayoutContextValue = {
    language: Language;
    theme: Theme;
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");
    const [theme, setTheme] = useState<Theme>("light");

    const value = useMemo<LayoutContextValue>(
        () => ({
            language,
            theme,
            onLanguageChange: (lang) => {
                setLanguage(lang);
                i18n.changeLanguage(lang);
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

export function useLayout(): LayoutContextValue {
    const ctx = useContext(LayoutContext);
    if (!ctx) {
        throw new Error("useLayout must be used inside <LayoutProvider>");
    }
    return ctx;
}
