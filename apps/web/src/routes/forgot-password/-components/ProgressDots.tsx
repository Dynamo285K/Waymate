import type { ForgotPasswordStep } from "../-hooks/useForgotPasswordFlow";

export function ProgressDots({ step }: { step: ForgotPasswordStep }) {
    return (
        <div className="flex gap-2 justify-center mb-6">
            {[1, 2, 3].map((value) => (
                <span
                    key={value}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        value <= step ? "bg-primary" : "bg-border"
                    }`}
                />
            ))}
        </div>
    );
}
