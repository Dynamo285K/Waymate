import { useTranslation } from "react-i18next";
import { StatCard } from "@waymate/ui";
import {
    IconBox,
    UsersIcon,
    StarIcon,
    LeafIcon,
} from "./icons/FeatureIcons";

export function HomeStatsSection() {
    const { t } = useTranslation();

    return (
        <section className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                icon={
                    <IconBox
                        bg="bg-(--color-success-bg)"
                        color="text-(--color-success-text)"
                    >
                        <UsersIcon />
                    </IconBox>
                }
                value="12 500+"
                label={t("home.stats.drivers")}
            />
            <StatCard
                icon={
                    <IconBox
                        bg="bg-(--color-warning-bg)"
                        color="text-(--color-warning-text)"
                    >
                        <StarIcon />
                    </IconBox>
                }
                value="4.9/5.0"
                label={t("home.stats.satisfaction")}
            />
            <StatCard
                icon={
                    <IconBox
                        bg="bg-(--color-success-bg)"
                        color="text-(--color-success-text)"
                    >
                        <LeafIcon />
                    </IconBox>
                }
                value="2 400t"
                label={t("home.stats.co2Saved")}
            />
        </section>
    );
}
