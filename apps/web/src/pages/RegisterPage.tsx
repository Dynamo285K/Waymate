import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AuthNavbar, RegisterBox } from "waymate-ui";
import type { Language } from "waymate-ui";

type RegisterPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};

export function RegisterPage({ language, theme, onLanguageChange, onThemeToggle }: RegisterPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div data-theme={theme} className="min-h-screen bg-(--color-bg)">
            <AuthNavbar
                language={language}
                onLanguageChange={onLanguageChange}
                theme={theme}
                onThemeToggle={onThemeToggle}
                onLogoClick={() => navigate("/")}
            />
            <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-4 py-12">
                <RegisterBox
                    onCreateAccountClick={() => {}}
                    onGoogleRegisterClick={() => {}}
                    onLoginClick={() => navigate("/login")}
                    labels={{
                        title: t("register.title"),
                        fullNamePlaceholder: t("register.fullName"),
                        emailPlaceholder: t("register.email"),
                        passwordPlaceholder: t("register.password"),
                        confirmPasswordPlaceholder: t("register.confirmPassword"),
                        createAccountButton: t("register.createAccountButton"),
                        continueWithGoogle: t("register.continueWithGoogle"),
                        or: t("register.or"),
                        alreadyHaveAccount: t("register.alreadyHaveAccount"),
                        login: t("register.login"),
                    }}
                />
            </div>
        </div>
    );
}
