export function FeatureVisual({
    bg,
    color,
    children,
}: {
    bg: string;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`w-11 h-11 ${bg} ${color} rounded-xl flex items-center justify-center icon-svg:w-5 icon-svg:h-5`}
        >
            {children}
        </div>
    );
}
