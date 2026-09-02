import { useState } from "react";

export type AvatarProps = {
    name?: string;
    src?: string;
    size?: "sm" | "md" | "lg";
};

function getInitials(name?: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
}

const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-11 h-11 text-base",
    lg: "w-16 h-16 text-xl",
};

export function Avatar({ name, src, size = "md" }: AvatarProps) {
    const [imgError, setImgError] = useState(false);
    const initials = getInitials(name);

    return (
        <div
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-border text-text-primary font-semibold overflow-hidden ${sizes[size]}`}
        >
            {src && !imgError ? (
                <img
                    src={src}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <span className="leading-none">{initials}</span>
            )}
        </div>
    );
}
