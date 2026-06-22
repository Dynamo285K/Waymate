import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
    createFileRoute,
    useNavigate,
    useLocation,
} from "@tanstack/react-router";
import { Button, TextLink } from "@waymate/ui";
import { DriverNavbar } from "../../../components/navigation/DriverNavbar";
import { PassengerNavbar } from "../../../components/navigation/PassengerNavbar";
import { useDriverNavbarProps } from "../../../features/driver/hooks/useDriverNavbarProps";
import { usePassengerNavbarProps } from "../../../hooks/shared/usePassengerNavbarProps";
import {
    useGetCarsBrands,
    useGetCarsBrandsByBrandModels,
    usePostCarsMe,
    getGetCarsMeQueryKey,
} from "../../../api-client/cars/cars";
import { authClient } from "../../../lib/auth-client";
import { getDisplayName } from "../../../lib/session-user";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { requireAudience } from "../../../lib/route-guards";
import { useLayout } from "../../../lib/use-layout";
import {
    carFormSchema,
    type CarFormInput,
    type CarFormValues,
} from "./-schema";
import { MakeModelFields } from "./-components/MakeModelFields";
import { SeatsField } from "./-components/SeatsField";
import { ColorField } from "./-components/ColorField";
import { LicensePlateField } from "./-components/LicensePlateField";

function AddCarPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const location = useLocation();
    const role = location.state.role ?? "driver";
    const backPath =
        role === "driver" ? "/driver/profile" : "/passenger/profile";

    const {
        control,
        handleSubmit,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CarFormInput, unknown, CarFormValues>({
        resolver: zodResolver(carFormSchema),
        defaultValues: {
            make: "",
            model: "",
            seats: null,
            color: null,
            plate: "",
        },
    });

    const make = useWatch({ control, name: "make" });

    const brandsQuery = useGetCarsBrands();
    const modelsQuery = useGetCarsBrandsByBrandModels(make, {
        query: { enabled: Boolean(make) },
    });

    const createCarMutation = usePostCarsMe({
        mutation: {
            onSuccess: async () => {
                await queryClient.invalidateQueries({
                    queryKey: getGetCarsMeQueryKey(),
                });
                navigate({ to: backPath });
            },
            onError: (error) => {
                setError("root", {
                    message: getErrorI18nKey(error, {}, "addCar.error"),
                });
            },
        },
    });

    // Brand/model come straight from the API (`car_models` is seeded
    // reference data — a plain DB read). No offline fallback: a fabricated
    // catalog has no real model id and so produces an un-submittable form.
    const carMakes =
        brandsQuery.data?.map((row) => row.brand).filter(Boolean) ?? [];
    const carModels = modelsQuery.data ?? [];

    const driverNavbarProps = useDriverNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const passengerNavbarProps = usePassengerNavbarProps({
        activeTab: "find-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const onSubmit: SubmitHandler<CarFormValues> = (values) => {
        const selectedModel = carModels.find(
            (row) => row.modelName === values.model
        );

        if (!selectedModel) {
            setError("model", { message: "addCar.requiredError" });
            return;
        }

        // Schema narrows seats/color to non-null and normalizes plate.
        createCarMutation.mutate({
            data: {
                modelId: selectedModel.id,
                spz: values.plate,
                countryCode: "SK",
                color: values.color,
                seatsTotal: values.seats + 1,
            },
        });
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            {role === "driver" ? (
                <DriverNavbar {...driverNavbarProps} />
            ) : (
                <PassengerNavbar {...passengerNavbarProps} />
            )}

            <section className="w-full px-4 sm:max-w-2xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <div className="text-sm mb-6">
                    <TextLink
                        variant="muted"
                        onClick={() => navigate({ to: backPath })}
                    >
                        {t("profile.backToProfile", "<- Back to My Profile")}
                    </TextLink>
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-8">
                    {t("addCar.title")}
                </h1>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                >
                    <MakeModelFields
                        control={control}
                        makeError={errors.make?.message}
                        modelError={errors.model?.message}
                        make={make}
                        carMakes={carMakes}
                        carModels={carModels}
                        isModelsLoading={modelsQuery.isLoading}
                        onMakeChange={() => setValue("model", "")}
                    />

                    <SeatsField
                        control={control}
                        error={errors.seats?.message}
                    />

                    <ColorField
                        control={control}
                        error={errors.color?.message}
                    />

                    <LicensePlateField
                        control={control}
                        error={errors.plate?.message}
                    />

                    <div className="p-6 flex flex-col gap-4 sm:items-end">
                        {errors.root?.message && (
                            <p className="w-full rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-text">
                                {t(errors.root.message)}
                            </p>
                        )}
                        <Button
                            type="submit"
                            variant="black"
                            disabled={
                                isSubmitting || createCarMutation.isPending
                            }
                        >
                            {createCarMutation.isPending
                                ? t("addCar.adding")
                                : t("addCar.addButton")}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export const Route = createFileRoute("/car/add/")({
    beforeLoad: requireAudience(["user"]),
    component: AddCarPage,
});
