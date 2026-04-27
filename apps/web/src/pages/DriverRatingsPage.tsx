import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { DriverNavbar, RatingSummaryCard, RatingCard } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";

type DriverRatingsPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

const RATINGS = [
    {
        id: 1,
        name: "Bob Smith",
        from: "Martin",
        to: "Brno",
        rating: 5,
        review: "Excellent driver, very punctual and friendly!",
    },
    {
        id: 2,
        name: "Alice Brown",
        from: "Brno",
        to: "Martin",
        rating: 4,
        review: "Good ride, clean car. Would recommend.",
    },
    {
        id: 3,
        name: "Carol Davis",
        from: "Brno",
        to: "Praha",
        rating: 5,
        review: "Perfect journey, great music and conversation.",
    },
];

export function DriverRatingsPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: DriverRatingsPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const navbarProps = useDriverNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const avgRating = +(
        RATINGS.reduce((s, r) => s + r.rating, 0) / RATINGS.length
    ).toFixed(1);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <button
                    onClick={() => navigate("/driver/profile")}
                    className="text-(--color-text-secondary) text-sm mb-4 hover:text-(--color-text-primary) transition-colors"
                >
                    {t("profile.backToProfile")}
                </button>

                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">
                    {t("ratings.title")}
                </h1>

                <RatingSummaryCard
                    rating={avgRating}
                    totalRatings={RATINGS.length}
                    totalRatingsLabel={t("ratings.totalRatings")}
                />

                <div className="flex flex-col gap-4 mt-6">
                    {RATINGS.map((r) => (
                        <RatingCard
                            key={r.id}
                            name={r.name}
                            from={r.from}
                            to={r.to}
                            rating={r.rating}
                            review={r.review}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
