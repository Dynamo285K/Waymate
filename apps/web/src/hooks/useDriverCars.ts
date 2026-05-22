import { useCallback, useMemo, useState } from "react";
import { useGetCarsMe } from "../api-client/cars/cars";
import type { OfferRideCar } from "../components/OfferRideForm";

export type CarMode = "saved" | "manual";

type UserCarRow = {
    id: string;
    brand: string;
    modelName: string;
    spz: string;
};

function toOfferRideCar(car: UserCarRow): OfferRideCar {
    return {
        id: car.id,
        brand: car.brand,
        model: car.modelName,
        plate: car.spz,
    };
}

type ManualEntry = {
    manualBrand: string;
    manualModel: string;
    manualPlate: string;
};

/**
 * Owns the offer-ride car picker: the driver's saved cars (the API list plus
 * any car created during this session), the saved/manual mode, and the
 * selected car. The two render-time syncs keep that state coherent as the
 * async car list resolves — extracted here so the page component no longer
 * carries them. Behaviour matches the previous inline implementation.
 */
export function useDriverCars(manualEntry: ManualEntry) {
    const [localSavedCars, setLocalSavedCars] = useState<OfferRideCar[]>([]);
    const [carMode, setCarMode] = useState<CarMode>("manual");
    const [selectedCarId, setSelectedCarId] = useState("");
    const [hasUserSelectedCarMode, setHasUserSelectedCarMode] = useState(false);

    const userCarsQuery = useGetCarsMe();

    const apiSavedCars = useMemo(
        () => userCarsQuery.data?.map((car) => toOfferRideCar(car)) ?? [],
        [userCarsQuery.data]
    );
    const driverCars = useMemo(
        () => [...apiSavedCars, ...localSavedCars],
        [apiSavedCars, localSavedCars]
    );

    // As the async car list resolves, keep mode/selection coherent: no cars →
    // force manual entry; cars present but none selected → select the first.
    // Synced during render via the prev-key compare.
    const driverCarsKey = driverCars.map((car) => car.id).join("|");
    const [prevDriverCarsKey, setPrevDriverCarsKey] = useState(driverCarsKey);
    if (driverCarsKey !== prevDriverCarsKey) {
        setPrevDriverCarsKey(driverCarsKey);
        if (driverCars.length === 0) {
            if (carMode === "saved") setCarMode("manual");
            if (selectedCarId) setSelectedCarId("");
        } else if (!driverCars.some((car) => car.id === selectedCarId)) {
            setSelectedCarId(driverCars[0].id);
        }
    }

    // First time saved cars appear while the (default) manual form is still
    // untouched, switch to the saved-car picker — unless the user already
    // picked a mode themselves.
    const { manualBrand, manualModel, manualPlate } = manualEntry;
    const manualEntryKey = `${carMode}|${manualBrand}|${manualModel}|${manualPlate}`;
    const [prevManualEntryKey, setPrevManualEntryKey] =
        useState(manualEntryKey);
    if (manualEntryKey !== prevManualEntryKey) {
        setPrevManualEntryKey(manualEntryKey);
        if (
            !hasUserSelectedCarMode &&
            driverCars.length > 0 &&
            carMode === "manual" &&
            !manualBrand &&
            !manualModel &&
            !manualPlate
        ) {
            setCarMode("saved");
        }
    }

    // User-initiated mode switch — records the explicit choice so the
    // auto-switch above no longer fires.
    const selectCarMode = useCallback((mode: CarMode) => {
        setHasUserSelectedCarMode(true);
        setCarMode(mode);
    }, []);

    const addLocalCar = useCallback((car: OfferRideCar) => {
        setLocalSavedCars((cars) => [...cars, car]);
    }, []);

    return {
        driverCars,
        carMode,
        setCarMode,
        selectCarMode,
        selectedCarId,
        setSelectedCarId,
        addLocalCar,
    };
}
