import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextLink } from "@/components/ui/TextLink";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { MailIcon } from "@/components/ui/icons/MailIcon";
import logo from "@/assets/logo_light_mode.png";

export type RegisterBoxLabels = {
    title: string;
    email: string;
    password: string;
    confirmPassword: string;
    showPassword?: string;
    hidePassword?: string;
    createAccountButton: string;
    continueWithGoogle: string;
    or: string;
    alreadyHaveAccount: string;
    login: string;
};

export type RegisterBoxProps = {
    email?: string;
    password?: string;
    confirmPassword?: string;
    emailError?: string;
    passwordError?: string;
    confirmPasswordError?: string;
    message?: string;
    isSubmitting?: boolean;
    labels?: RegisterBoxLabels;
    onEmailChange?: (value: string) => void;
    onPasswordChange?: (value: string) => void;
    onConfirmPasswordChange?: (value: string) => void;
    onSubmit?: () => void;
    onCreateAccountClick?: () => void;
    onGoogleRegisterClick?: () => void;
    onLoginClick?: () => void;
};

export function RegisterBox({
    email,
    password,
    confirmPassword,
    emailError,
    passwordError,
    confirmPasswordError,
    message,
    isSubmitting,
    labels,
    onEmailChange,
    onPasswordChange,
    onConfirmPasswordChange,
    onSubmit,
    onCreateAccountClick,
    onGoogleRegisterClick,
    onLoginClick,
}: RegisterBoxProps) {
    const handleSubmit = (event: { preventDefault(): void }) => {
        event.preventDefault();
        onSubmit?.();
        onCreateAccountClick?.();
    };

    return (
        <Card>
            <div className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3 text-center">
                    <img
                        src={logo}
                        alt="WayMate logo"
                        className="w-[150px] h-[150px] object-contain"
                    />
                    <h2 className="m-0 text-panel-title leading-[34px] font-bold text-text-primary">
                        {labels?.title ?? "Create account"}
                    </h2>
                </div>

                <form
                    className="flex flex-col gap-3"
                    onSubmit={handleSubmit}
                >
                    <div className="flex flex-col gap-2">
                        <Input
                            type="email"
                            name="waymate-register-email"
                            autoComplete="email"
                            value={email}
                            disabled={isSubmitting}
                            onChange={(event) =>
                                onEmailChange?.(event.target.value)
                            }
                            placeholder={labels?.email ?? "Email"}
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
                            name="waymate-register-password"
                            autoComplete="new-password"
                            value={password}
                            disabled={isSubmitting}
                            onChange={(event) =>
                                onPasswordChange?.(event.target.value)
                            }
                            placeholder={labels?.password ?? "Password"}
                            showPasswordLabel={labels?.showPassword}
                            hidePasswordLabel={labels?.hidePassword}
                        />
                        {passwordError && (
                            <p className="m-0 text-sm leading-5 text-red">
                                {passwordError}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <PasswordInput
                            name="waymate-register-confirm-password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            disabled={isSubmitting}
                            onChange={(event) =>
                                onConfirmPasswordChange?.(event.target.value)
                            }
                            placeholder={
                                labels?.confirmPassword ?? "Confirm password"
                            }
                            showPasswordLabel={labels?.showPassword}
                            hidePasswordLabel={labels?.hidePassword}
                        />
                        {confirmPasswordError && (
                            <p className="m-0 text-sm leading-5 text-red">
                                {confirmPasswordError}
                            </p>
                        )}
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
                        {labels?.createAccountButton ?? "Create account"}
                    </Button>
                </form>

                <Divider label={labels?.or ?? "or"} />

                <Button
                    variant="secondary"
                    fullWidth
                    onClick={onGoogleRegisterClick}
                    disabled={isSubmitting}
                >
                    <>
                        <span>
                            {labels?.continueWithGoogle ??
                                "Continue with Google"}
                        </span>
                        <GoogleIcon />
                    </>
                </Button>

                <div className="flex items-center justify-center gap-1 text-center">
                    <span className="text-sm leading-5 text-text-secondary">
                        {labels?.alreadyHaveAccount ??
                            "Already have an account?"}
                    </span>
                    <TextLink onClick={onLoginClick}>
                        {labels?.login ?? "Login"}
                    </TextLink>
                </div>
            </div>
        </Card>
    );
}
