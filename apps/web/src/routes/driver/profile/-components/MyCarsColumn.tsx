import { useTranslation } from "react-i18next";
import { CarCard, Button } from "@waymate/ui";
import { getErrorI18nKey } from "../../../../lib/api-errors";

type ProfileCar = {
    id: string;
    brand: string;
    modelName: string;
};

export function MyCarsColumn({
    cars,
    loading,
    error,
    onAddCar,
    onDeleteCar,
}: {
    cars: ProfileCar[] | undefined;
    loading: boolean;
    error: unknown;
    onAddCar: () => void;
    onDeleteCar: (carId: string) => void;
}) {
    const { t } = useTranslation();

    return (
        <div className="lg:w-72 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">
                    {t("profile.myCars")}
                </h2>
                <Button onClick={onAddCar}>{t("profile.addCar")}</Button>
            </div>
            {loading && (
                <p className="text-text-secondary">
                    {t("profile.loadingCars")}
                </p>
            )}
            {Boolean(error) && (
                <p className="text-text-secondary">
                    {t(getErrorI18nKey(error, {}, "profile.carsError"))}
                </p>
            )}
            {!loading && !error && cars?.length === 0 && (
                <p className="text-text-secondary">{t("profile.noCars")}</p>
            )}
            {cars?.map((car) => (
                <CarCard
                    key={car.id}
                    model={`${car.brand} ${car.modelName}`}
                    onDelete={() => onDeleteCar(car.id)}
                />
            ))}
        </div>
    );
}
