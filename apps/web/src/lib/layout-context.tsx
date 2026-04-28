import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import i18n from "../i18n";
import type { Language } from "@waymate/ui";
import { toI18nLanguage } from "./language";
import { getCurrentUser } from "./auth";

export type Theme = "light" | "dark";

export type LayoutContextValue = {
    language: Language;
    theme: Theme;
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userId?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    userBio?: string;
    userCreatedAt?: string | Date;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");
    const [theme, setTheme] = useState<Theme>("light");
    const { data: currentUser } = useQuery({
        queryKey: ["users", "me"],
        queryFn: getCurrentUser,
        retry: false,
    });

    const userName = useMemo(() => {
        if (!currentUser) return undefined;

        const fullName = [currentUser.firstName, currentUser.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();

        return fullName || currentUser.name || currentUser.email;
    }, [currentUser]);

    const value = useMemo<LayoutContextValue>(
        () => ({
            language,
            theme,
            userId: currentUser?.id,
            userName,
            userEmail: currentUser?.email,
            userPhone: currentUser?.phone ?? undefined,
            userBio: currentUser?.bio ?? undefined,
            userCreatedAt: currentUser?.createdAt,
            onLanguageChange: (lang) => {
                const i18nLanguage = toI18nLanguage(lang);
                setLanguage(i18nLanguage as Language);
                i18n.changeLanguage(i18nLanguage);
            },
            onThemeToggle: () =>
                setTheme((current) => (current === "light" ? "dark" : "light")),
        }),
        [
            currentUser?.bio,
            currentUser?.createdAt,
            currentUser?.email,
            currentUser?.id,
            currentUser?.phone,
            language,
            theme,
            userName,
        ]
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
