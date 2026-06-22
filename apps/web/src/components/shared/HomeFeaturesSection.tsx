import { useTranslation } from "react-i18next";
import { FeatureCard } from "@waymate/ui";
import {
    IconBox,
    ShieldIcon,
    CoinsIcon,
    LeafIcon,
    MessageIcon,
    BoltIcon,
    StarIcon,
} from "./icons/FeatureIcons";

type HomeFeaturesSectionProps = {
    // The driver and passenger home pages share this block verbatim and differ
    // only in their outer background / top margin, so those are overridable.
    sectionClassName?: string;
    gridClassName?: string;
};

const DEFAULT_SECTION_CLASS = "bg-background border-t border-border py-16 px-4";
const DEFAULT_GRID_CLASS =
    "mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left";

export function HomeFeaturesSection({
    sectionClassName = DEFAULT_SECTION_CLASS,
    gridClassName = DEFAULT_GRID_CLASS,
}: HomeFeaturesSectionProps) {
    const { t } = useTranslation();

    return (
        <section className={sectionClassName}>
            <div className="w-full sm:max-w-5xl sm:mx-auto text-center">
                <h2 className="text-2xl sm:text-4xl font-black text-text-primary">
                    {t("home.features.title")}
                </h2>
                <p className="mt-2 text-text-secondary">
                    {t("home.features.subtitle")}
                </p>
                <div className={gridClassName}>
                    <FeatureCard
                        icon={
                            <IconBox
                                bg="bg-success-bg"
                                color="text-success-text"
                            >
                                <ShieldIcon />
                            </IconBox>
                        }
                        title={t("home.features.verifiedDrivers.title")}
                        description={t(
                            "home.features.verifiedDrivers.description"
                        )}
                    />
                    <FeatureCard
                        icon={
                            <IconBox
                                bg="bg-success-bg"
                                color="text-success-text"
                            >
                                <CoinsIcon />
                            </IconBox>
                        }
                        title={t("home.features.fairPricing.title")}
                        description={t("home.features.fairPricing.description")}
                    />
                    <FeatureCard
                        icon={
                            <IconBox
                                bg="bg-primary/10"
                                color="text-primary"
                            >
                                <LeafIcon />
                            </IconBox>
                        }
                        title={t("home.features.ecoFriendly.title")}
                        description={t("home.features.ecoFriendly.description")}
                    />
                    <FeatureCard
                        icon={
                            <IconBox
                                bg="bg-primary/10"
                                color="text-primary"
                            >
                                <MessageIcon />
                            </IconBox>
                        }
                        title={t("home.features.directChat.title")}
                        description={t("home.features.directChat.description")}
                    />
                    <FeatureCard
                        icon={
                            <IconBox
                                bg="bg-warning-bg"
                                color="text-warning-text"
                            >
                                <BoltIcon />
                            </IconBox>
                        }
                        title={t("home.features.fastBooking.title")}
                        description={t("home.features.fastBooking.description")}
                    />
                    <FeatureCard
                        icon={
                            <IconBox
                                bg="bg-danger-bg"
                                color="text-danger-text"
                            >
                                <StarIcon />
                            </IconBox>
                        }
                        title={t("home.features.ratings.title")}
                        description={t("home.features.ratings.description")}
                    />
                </div>
            </div>
        </section>
    );
}
