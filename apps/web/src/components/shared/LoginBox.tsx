import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextLink } from "@/components/ui/TextLink";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { MailIcon } from "@/components/ui/icons/MailIcon";
import logo from "@/assets/logo_light_mode.png";

export type LoginBoxLabels = {
    title?: string;
    emailLabel?: string;
    emailPlaceholder?: string;
    passwordLabel?: string;
    passwordPlaceholder?: string;
    showPassword?: string;
    hidePassword?: string;
    forgotPassword?: string;
    loginButton?: string;
    loginWithGoogle?: string;
    or?: string;
    noAccount?: string;
    createAccount?: string;
};

export type LoginBoxProps = {
    email?: string;
    password?: string;
    emailError?: string;
    passwordError?: string;
    message?: string;
    isSubmitting?: boolean;
    onEmailChange?: (value: string) => void;
    onPasswordChange?: (value: string) => void;
    onSubmit?: () => void;
    onLoginClick?: () => void;
    onGoogleLoginClick?: () => void;
    onForgotPasswordClick?: () => void;
    onCreateAccountClick?: () => void;
    labels?: LoginBoxLabels;
};

export function LoginBox({
    email,
    password,
    emailError,
    passwordError,
    message,
    isSubmitting,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    onLoginClick,
    onGoogleLoginClick,
    onForgotPasswordClick,
    onCreateAccountClick,
    labels,
}: LoginBoxProps) {
    const handleSubmit = (event: { preventDefault(): void }) => {
        event.preventDefault();
        onSubmit?.();
        onLoginClick?.();
    };

    return (
        <Card>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 items-center text-center">
                    <img
                        src={logo}
                        alt="WayMate logo"
                        className="w-[150px] h-[150px] object-contain"
                    />
                    <h2 className="m-0 text-auth-title leading-[38px] font-semibold text-text-primary">
                        {labels?.title ?? "Login to your account"}
                    </h2>
                </div>

                <form
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmit}
                >
                    <div className="flex flex-col gap-2">
                        <Input
                            label={labels?.emailLabel ?? "Email"}
                            type="email"
                            name="waymate-login-email"
                            autoComplete="email"
                            placeholder={
                                labels?.emailPlaceholder ?? "Enter your email"
                            }
                            value={email}
                            disabled={isSubmitting}
                            onChange={(event) =>
                                onEmailChange?.(event.target.value)
                            }
                            leftIcon={<MailIcon />}
                        />
                        {emailError && (
                            <p className="m-0 text-sm leading-5 text-red">
                                {emailError}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <PasswordInput
                            label={labels?.passwordLabel ?? "Password"}
                            name="waymate-login-password"
                            autoComplete="current-password"
                            placeholder={
                                labels?.passwordPlaceholder ??
                                "Enter your password"
                            }
                            value={password}
                            disabled={isSubmitting}
                            onChange={(event) =>
                                onPasswordChange?.(event.target.value)
                            }
                            showPasswordLabel={labels?.showPassword}
                            hidePasswordLabel={labels?.hidePassword}
                        />
                        {passwordError && (
                            <p className="m-0 text-sm leading-5 text-red">
                                {passwordError}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end text-text-secondary">
                        <TextLink
                            variant="muted"
                            onClick={onForgotPasswordClick}
                        >
                            {labels?.forgotPassword ?? "Forgot your password?"}
                        </TextLink>
                    </div>

                    {message && (
                        <p className="m-0 text-sm leading-5 text-red text-center">
                            {message}
                        </p>
                    )}

                    <Button
                        fullWidth
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {labels?.loginButton ?? "Login"}
                    </Button>
                </form>

                <Divider label={labels?.or ?? "or"} />

                <Button
                    variant="secondary"
                    fullWidth
                    onClick={onGoogleLoginClick}
                    disabled={isSubmitting}
                >
                    <>
                        <span>
                            {labels?.loginWithGoogle ?? "Login with Google"}
                        </span>
                        <GoogleIcon />
                    </>
                </Button>

                <div className="flex justify-center items-center gap-1.5 flex-wrap">
                    <span className="text-sm leading-5 text-text-secondary">
                        {labels?.noAccount ?? "Don't have an account?"}
                    </span>
                    <TextLink onClick={onCreateAccountClick}>
                        {labels?.createAccount ?? "Create account"}
                    </TextLink>
                </div>
            </div>
        </Card>
    );
}
