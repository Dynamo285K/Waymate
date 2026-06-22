export function FeatureVisual({
    tone,
    children,
}: {
    tone:
        | "success"
        | "primary"
        | "warning"
        | "danger"
        | "yellow"
        | "blue"
        | "purple"
        | "rose";
    children: React.ReactNode;
}) {
    const toneClass = {
        success:
            "bg-success-bg text-success-text icon-svg:text-success-text icon-svg:stroke-current",
        primary:
            "bg-primary/10 text-primary icon-svg:text-primary icon-svg:stroke-current",
        warning:
            "bg-warning-bg text-warning-text icon-svg:text-warning-text icon-svg:stroke-current",
        danger:
            "bg-danger-bg text-danger-text icon-svg:text-danger-text icon-svg:stroke-current",
        yellow:
            "bg-dark-yellow/10 text-dark-yellow icon-svg:text-dark-yellow icon-svg:stroke-current",
        blue: "bg-royal-blue/10 text-royal-blue icon-svg:text-royal-blue icon-svg:stroke-current",
        purple: "bg-lila/10 text-lila icon-svg:text-lila icon-svg:stroke-current",
        rose: "bg-rose/10 text-rose icon-svg:text-rose icon-svg:stroke-current",
    }[tone];

    return (
        <div
            className={`w-11 h-11 ${toneClass} rounded-xl flex items-center justify-center icon-svg:w-5 icon-svg:h-5`}
        >
            {children}
        </div>
    );
}
