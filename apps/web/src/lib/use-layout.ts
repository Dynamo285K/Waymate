import { createContext, useContext } from "react";
import type { Language } from "../components/controls/LanguageSwitcher";

export type Theme = "light" | "dark";

export type LayoutContextValue = {
    language: Language;
    theme: Theme;
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

export const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayout(): LayoutContextValue {
    const ctx = useContext(LayoutContext);
    if (!ctx) {
        throw new Error("useLayout must be used inside <LayoutProvider>");
    }
    return ctx;
}
