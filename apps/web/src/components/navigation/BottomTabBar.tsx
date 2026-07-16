import type { ReactNode } from "react";

export type BottomTabItem = {
    key: string;
    label: string;
    icon: ReactNode;
    active?: boolean;
    badge?: number;
    onClick?: () => void;
};

export type BottomTabBarProps = {
    items: BottomTabItem[];
    ariaLabel?: string;
    className?: string;
};

export function BottomTabBar({
    items,
    ariaLabel = "Primary navigation",
    className,
}: BottomTabBarProps) {
    return (
        <nav
            className={`fixed left-0 right-0 bottom-0 z-100 bg-card/95 border-t border-border shadow-navbar backdrop-blur supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))]${className ? ` ${className}` : ""}`}
            aria-label={ariaLabel}
        >
            <div
                className="grid min-h-16 px-2 pt-1.5"
                style={{
                    gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
                }}
            >
                {items.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1.5 text-[11px] font-semibold leading-none transition-colors duration-150 ${
                            item.active
                                ? "text-primary"
                                : "text-text-secondary hover:text-text-primary"
                        }`}
                        aria-current={item.active ? "page" : undefined}
                        onClick={item.onClick}
                    >
                        <span
                            className={`relative inline-flex h-8 min-w-11 items-center justify-center rounded-full transition-colors duration-150 [&_svg]:h-5 [&_svg]:w-5 ${
                                item.active
                                    ? "bg-primary-tint text-primary"
                                    : "bg-transparent"
                            }`}
                        >
                            {item.icon}
                            {item.badge ? (
                                <span
                                    className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-bold leading-none text-white"
                                    aria-label={`${item.badge} unread`}
                                >
                                    {item.badge > 99 ? "99+" : item.badge}
                                </span>
                            ) : null}
                        </span>
                        <span className="max-w-full truncate">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
