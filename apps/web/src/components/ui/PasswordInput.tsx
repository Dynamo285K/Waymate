import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { EyeIcon, EyeOffIcon, LockIcon } from "./icons";

export type PasswordInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
> & {
    label?: string;
    leftIcon?: ReactNode;
    showPasswordLabel?: string;
    hidePasswordLabel?: string;
};

export function PasswordInput({
    label,
    showPasswordLabel = "Show password",
    hidePasswordLabel = "Hide password",
    leftIcon = <LockIcon />,
    ...props
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Input
            {...props}
            label={label}
            type={showPassword ? "text" : "password"}
            leftIcon={leftIcon}
            rightIcon={
                <Button
                    type="button"
                    variant="unstyled"
                    className="shrink-0 text-text-secondary hover:text-text-primary [&_svg]:w-5 [&_svg]:h-5"
                    aria-label={
                        showPassword ? hidePasswordLabel : showPasswordLabel
                    }
                    onClick={() => setShowPassword((value) => !value)}
                >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
            }
        />
    );
}
