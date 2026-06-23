import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button, CloseIcon, IconButton, Modal, Textarea } from "@waymate/ui";
import { usePostReports } from "../../api-client/reports/reports";
import { getGetReportsAdminQueryKey } from "../../api-client/reports/reports";
import { ReportType } from "../../api-client/model/reportType";
import type { CreateReportBody } from "../../api-client/model/createReportBody";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorI18nKey } from "../../lib/api-errors";
import { reportUserErrorMap } from "../../lib/report-errors";
import { useLayout } from "../../lib/use-layout";
import { FilterSelect } from "../../features/admin/components/FilterSelect";

const REPORT_TYPE_OPTIONS: ReadonlyArray<{
    value: ReportType;
    labelKey: string;
}> = [
    {
        value: ReportType.INAPPROPRIATE_BEHAVIOR,
        labelKey: "report.types.inappropriateBehavior",
    },
    { value: ReportType.NO_SHOW, labelKey: "report.types.noShow" },
    {
        value: ReportType.OVERCHARGING,
        labelKey: "report.types.overcharging",
    },
    {
        value: ReportType.LEFT_LUGGAGE,
        labelKey: "report.types.leftLuggage",
    },
    {
        value: ReportType.SAFETY_ISSUE,
        labelKey: "report.types.safetyIssue",
    },
    { value: ReportType.OTHER, labelKey: "report.types.other" },
];

const reportFormSchema = z.object({
    reportType: z.nativeEnum(ReportType),
    description: z.string().trim().min(1).max(2000),
    blockTarget: z.boolean(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

type ReportUserModalProps = {
    targetUserId: string;
    targetName: string;
    rideId?: string;
    onClose: () => void;
    onSuccess?: () => void;
};

export function ReportUserModal({
    targetUserId,
    targetName,
    rideId,
    onClose,
    onSuccess,
}: ReportUserModalProps) {
    const { t } = useTranslation();
    const { theme } = useLayout();
    const queryClient = useQueryClient();

    const {
        register,
        control,
        handleSubmit,
        formState: { isValid },
    } = useForm<ReportFormValues>({
        resolver: zodResolver(reportFormSchema),
        mode: "onChange",
        defaultValues: {
            reportType: ReportType.INAPPROPRIATE_BEHAVIOR,
            description: "",
            blockTarget: true,
        },
    });

    const mutation = usePostReports({
        mutation: {
            onSuccess: async () => {
                await queryClient.invalidateQueries({
                    queryKey: getGetReportsAdminQueryKey(),
                });
                onSuccess?.();
                onClose();
            },
        },
    });

    const onSubmit: SubmitHandler<ReportFormValues> = (values) => {
        const body: CreateReportBody = {
            targetUserId,
            reportType: values.reportType,
            description: values.description.trim(),
            blockTarget: values.blockTarget,
            ...(rideId ? { rideId } : {}),
        };
        mutation.mutate({ data: body });
    };

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full min-w-0 max-w-lg p-5 sm:p-8 max-h-modal-body overflow-y-auto"
            >
                <div className="flex items-start justify-between gap-4 mb-5">
                    <h2 className="text-xl font-bold text-text-primary min-w-0 break-words">
                        {t("report.title")} — {targetName}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<CloseIcon />}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                <p className="text-sm text-text-secondary mb-5 break-words">
                    {t("report.intro")}
                </p>

                <div className="mb-5">
                    <label className="text-sm font-semibold text-text-primary mb-1.5 block">
                        {t("report.typeLabel")}{" "}
                        <span className="text-danger-text">*</span>
                    </label>
                    <Controller
                        control={control}
                        name="reportType"
                        render={({ field }) => (
                            <FilterSelect
                                value={field.value}
                                onValueChange={field.onChange}
                                ariaLabel={t("report.typeLabel")}
                                options={REPORT_TYPE_OPTIONS.map((opt) => ({
                                    value: opt.value,
                                    label: t(opt.labelKey),
                                }))}
                            />
                        )}
                    />
                </div>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-text-primary mb-1.5 block">
                        {t("report.descriptionLabel")}{" "}
                        <span className="text-danger-text">*</span>
                    </label>
                    <Controller
                        control={control}
                        name="description"
                        render={({ field }) => (
                            <Textarea
                                placeholder={t("report.descriptionPlaceholder")}
                                maxLength={2000}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>

                <label className="flex items-start gap-2.5 mb-6 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        {...register("blockTarget")}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                    />
                    <span className="text-sm text-text-primary min-w-0">
                        {t("report.blockUser")}
                        <span className="block text-xs text-text-secondary break-words">
                            {t("report.blockUserHint")}
                        </span>
                    </span>
                </label>

                {mutation.isError && (
                    <p className="text-sm text-danger-text mb-4">
                        {t(getErrorI18nKey(mutation.error, reportUserErrorMap))}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="secondary"
                        className="justify-center"
                        onClick={onClose}
                        disabled={mutation.isPending}
                    >
                        {t("report.cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="red"
                        className="justify-center"
                        disabled={!isValid || mutation.isPending}
                    >
                        {t("report.submit")}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
