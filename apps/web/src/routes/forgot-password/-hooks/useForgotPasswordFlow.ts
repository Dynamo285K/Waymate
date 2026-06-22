import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestPasswordReset, resetPassword } from "../../../lib/auth";

const formSchema = z
    .object({
        email: z
            .string()
            .trim()
            .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
                message: "login.invalidEmail",
            }),
        newPassword: z.string().min(8, "register.passwordTooShort"),
        confirmPassword: z.string(),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        path: ["confirmPassword"],
        message: "register.passwordMismatch",
    });

export type ForgotPasswordFormValues = z.infer<typeof formSchema>;
export type ForgotPasswordStep = 1 | 2 | 3;

export function useForgotPasswordFlow() {
    const navigate = useNavigate();
    const initialFromUrl = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const error = params.get("error");
        return {
            token,
            hasError: Boolean(error),
            step: (token ? 3 : 1) as 1 | 3,
        };
    }, []);

    const [step, setStep] = useState<ForgotPasswordStep>(initialFromUrl.step);
    const [countdown, setCountdown] = useState(59);
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [resetError, setResetError] = useState<string | null>(
        initialFromUrl.hasError ? "forgotPassword.invalidToken" : null
    );
    const [resetToken] = useState<string | null>(initialFromUrl.token);

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", newPassword: "", confirmPassword: "" },
    });

    const enteredEmail = useWatch({ control: form.control, name: "email" });
    const newPassword = useWatch({
        control: form.control,
        name: "newPassword",
    });

    // The countdown is reset by `handleSendCode` (the only path into step 2),
    // so the effect just owns the ticking interval — no synchronous setState
    // in the effect body.
    useEffect(() => {
        if (step !== 2) return;
        const timer = setInterval(
            () => setCountdown((value) => (value > 0 ? value - 1 : 0)),
            1000
        );
        return () => clearInterval(timer);
    }, [step]);

    async function handleSendCode() {
        const ok = await form.trigger("email");
        if (!ok || isSendingReset) return;

        setIsSendingReset(true);
        setResetError(null);

        const { error } = await requestPasswordReset({ email: enteredEmail });

        setIsSendingReset(false);

        if (error) {
            setResetError("forgotPassword.error");
            return;
        }

        setCountdown(59);
        setStep(2);
    }

    async function handleSetPassword() {
        const ok = await form.trigger(["newPassword", "confirmPassword"]);
        if (!ok || !resetToken || isResettingPassword) return;

        setIsResettingPassword(true);
        setResetError(null);

        const { error } = await resetPassword({
            token: resetToken,
            newPassword,
        });

        setIsResettingPassword(false);

        if (error) {
            setResetError("forgotPassword.resetError");
            return;
        }

        navigate({ to: "/login" });
    }

    return {
        step,
        countdown,
        enteredEmail,
        form,
        resetError,
        isSendingReset,
        isResettingPassword,
        handleSendCode,
        handleSetPassword,
        navigateToLogin: () => navigate({ to: "/login" }),
    };
}
