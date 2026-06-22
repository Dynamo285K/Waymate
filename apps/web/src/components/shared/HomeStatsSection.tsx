import { useTranslation } from "react-i18next";
import { LeafIcon, StarIcon, StatCard, UsersIcon } from "@waymate/ui";
import { FeatureVisual } from "./FeatureVisual";

export function HomeStatsSection() {
    const { t } = useTranslation();

    return (
        <section className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
                icon={
                    <FeatureVisual tone="blue">
                        <UsersIcon />
                    </FeatureVisual>
                }
                value="12 500+"
                label={t("home.stats.drivers")}
            />
            <StatCard
                icon={
                    <FeatureVisual tone="yellow">
                        <StarIcon />
                    </FeatureVisual>
                }
                value="4.9/5.0"
                label={t("home.stats.satisfaction")}
            />
            <StatCard
                icon={
                    <FeatureVisual tone="success">
                        <LeafIcon />
                    </FeatureVisual>
                }
                value="2 400t"
                label={t("home.stats.co2Saved")}
            />
        </section>
    );
}
