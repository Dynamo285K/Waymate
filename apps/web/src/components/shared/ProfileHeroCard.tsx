import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { StarIcon } from "@/components/ui/icons/StarIcon";
import { PenIcon } from "@/components/ui/icons/PenIcon";

export type ProfileHeroCardLabels = {
    viewAllRatings?: string;
    memberSince?: string;
    editProfile?: string;
};

export type ProfileHeroCardProps = {
    name: string;
    email: string;
    rating: string;
    memberSince: string;
    avatarSrc?: string;
    onViewRatingsClick?: () => void;
    onEditProfileClick?: () => void;
    labels?: ProfileHeroCardLabels;
};

export function ProfileHeroCard({
    name,
    email,
    rating,
    memberSince,
    avatarSrc,
    onViewRatingsClick,
    onEditProfileClick,
    labels,
}: ProfileHeroCardProps) {
    return (
        <div className="w-full bg-card rounded-[18px] py-7 px-8 shadow-card flex items-center justify-between gap-8 box-border max-900:flex-col max-900:items-start max-900:p-5 max-900:gap-4">
            <div className="flex items-center gap-6 min-w-0 max-900:flex-row max-900:items-start max-900:gap-4">
                <Avatar
                    name={name}
                    src={avatarSrc}
                    size="lg"
                />

                <div className="flex flex-col gap-2.5">
                    <div className="flex flex-col gap-1">
                        <h1 className="m-0 text-2xl leading-8 font-bold text-text-primary">
                            {name}
                        </h1>
                        <p className="m-0 text-base leading-6 text-text-secondary">
                            {email}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center justify-center text-dark-yellow [&_svg]:w-[26px] [&_svg]:h-[26px] [&_svg]:fill-current">
                                <StarIcon />
                            </span>
                            <span className="text-lg leading-7 font-semibold text-text-secondary">
                                {rating}
                            </span>
                        </div>

                        <TextLink onClick={onViewRatingsClick}>
                            {labels?.viewAllRatings ?? "view all ratings"} →
                        </TextLink>
                    </div>

                    <p className="m-0 text-base leading-6 text-text-secondary">
                        {labels?.memberSince ?? "Member since"} {memberSince}
                    </p>
                </div>
            </div>

            <div className="shrink-0 max-900:w-full">
                <Button
                    className="min-w-[170px] max-900:w-full"
                    onClick={onEditProfileClick}
                >
                    <span className="inline-flex items-center gap-2 [&_svg]:w-4 [&_svg]:h-4">
                        {labels?.editProfile ?? "Edit profile"}
                        <PenIcon />
                    </span>
                </Button>
            </div>
        </div>
    );
}
