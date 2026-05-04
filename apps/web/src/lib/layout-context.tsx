import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import i18n from "../i18n";
import type { Language } from "@waymate/ui";
import { toI18nLanguage } from "./language";
import { CURRENT_USER_QUERY_KEY, getCurrentUserOrNull } from "./auth";
import {
    LayoutContext,
    type LayoutContextValue,
    type Theme,
} from "./use-layout";

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");
    const [theme, setTheme] = useState<Theme>("light");
    const { data: currentUser } = useQuery({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: getCurrentUserOrNull,
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
            userRole: currentUser?.userRole,
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
            currentUser?.userRole,
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
