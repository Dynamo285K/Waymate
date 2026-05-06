import type { Language } from "../components/controls/LanguageSwitcher";

export function toI18nLanguage(language: Language): string {
    return language === "cz" ? "cs" : language;
}

export function toUiLanguage(language: Language): Language {
    return language === ("cs" as Language) ? "cz" : language;
}
