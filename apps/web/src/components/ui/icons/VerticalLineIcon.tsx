type VerticalLineIconProps = {
    className?: string;
    "aria-hidden"?: boolean;
};

export function VerticalLineIcon(props: VerticalLineIconProps) {
    return (
        <svg
            width="2"
            height="24"
            viewBox="0 0 2 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <line
                x1="1"
                y1="0"
                x2="1"
                y2="24"
                stroke="currentColor"
                strokeWidth="2"
            />
        </svg>
    );
}
