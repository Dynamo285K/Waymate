import { useState, useRef, useEffect } from "react";
import { Input, MapPinIcon } from "@waymate/ui";
import { useUserLocation } from "../hooks/useUserLocation";


const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 2;

import { fetchPhotonLocations } from "../lib/geocoding/photon";
import type { LocationSuggestion } from "../lib/geocoding/photon";

export type { LocationSuggestion };

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const dLat = lat1 - lat2;
    const dLon = (lon1 - lon2) * Math.cos((lat1 + lat2) * Math.PI / 360);
    return Math.sqrt(dLat * dLat + dLon * dLon) * 111;
}

type LocationAutocompleteProps = {
    value: LocationSuggestion | null;
    onChange: (location: LocationSuggestion | null) => void;
    placeholder?: string;
    label?: string;
    searchType?: "city" | "address";
    parentCity?: LocationSuggestion | null;
};

function SpinnerIcon() {
    return (
        <span
            style={{
                display: "inline-block",
                width: 14,
                height: 14,
                border: "2px solid var(--color-primary)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
            }}
            aria-hidden
        />
    );
}

export function LocationAutocomplete({
    value,
    onChange,
    placeholder = "Search location…",
    label,
    searchType = "address",
    parentCity = null,
}: LocationAutocompleteProps) {
    const [inputValue, setInputValue] = useState(value?.address ?? "");
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const userLocation = useUserLocation();
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);

    const [prevValueId, setPrevValueId] = useState(value?.id);
    if (value?.id !== prevValueId) {
        setPrevValueId(value?.id);
        setInputValue(value?.address ?? "");
        setSuggestions([]);
        setOpen(false);
        setActiveIndex(-1);
    }

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
                setInputValue(value?.address ?? "");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [value?.address]);

    useEffect(() => {
        if (inputValue.length < MIN_QUERY_LENGTH) return;
        if (value && inputValue === value.address) return;

        const id = ++requestIdRef.current;

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Ak máme zadané rodičovské mesto, zameriame dopyt vyslovene naň.
                const finalQuery = parentCity ? `${inputValue}, ${parentCity.city}` : inputValue;
                
                // Prioritne hľadáme v okolí vybratého mesta, ak ho nemáme, použijeme polohu užívateľa.
                const bias = parentCity ? { lat: parentCity.lat, lng: parentCity.lng } : userLocation;
                
                const results = await fetchPhotonLocations(finalQuery, bias, searchType, parentCity);
                
                let finalResults = results;
                
                // Ak je zadané mesto, natvrdo vymažeme všetko mimo jeho hraníc
                if (parentCity && searchType === "address") {
                    finalResults = results.filter(r => {
                        // Ochrana: Geografická klietka (Musí byť fyzicky v obdĺžniku)
                        if (parentCity.extent) {
                            const [minLon, maxLat, maxLon, minLat] = parentCity.extent;
                            return r.lng >= minLon && r.lng <= maxLon && r.lat >= minLat && r.lat <= maxLat;
                        } else {
                            const dist = getDistanceKm(r.lat, r.lng, parentCity.lat, parentCity.lng);
                            return dist <= 15;
                        }
                    });
                }

                if (id !== requestIdRef.current) return;
                setSuggestions(finalResults);
                setOpen(finalResults.length > 0);
                setActiveIndex(-1);
            } catch {
                if (id !== requestIdRef.current) return;
                setSuggestions([]);
                setOpen(false);
            } finally {
                if (id === requestIdRef.current) setIsLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [inputValue, value?.address]);

    function handleSelect(location: LocationSuggestion) {
        onChange(location);
        setInputValue(location.address);
        setSuggestions([]);
        setOpen(false);
        setActiveIndex(-1);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const text = e.target.value;
        setInputValue(text);
        if (!text) onChange(null);
        if (text.length < MIN_QUERY_LENGTH) {
            setSuggestions([]);
            setOpen(false);
            setIsLoading(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!open) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const loc = suggestions[activeIndex];
            if (loc) handleSelect(loc);
        } else if (e.key === "Escape") {
            setOpen(false);
            setInputValue(value?.address ?? "");
        }
    }

    return (
        <div
            ref={containerRef}
            style={{ position: "relative" }}
        >
            <Input
                label={label}
                leftIcon={<MapPinIcon />}
                rightIcon={isLoading ? <SpinnerIcon /> : undefined}
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={open}
            />

            {open && suggestions.length > 0 && (
                <ul
                    role="listbox"
                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-(--color-card) border border-(--color-border) rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                >
                    {suggestions.map((loc, idx) => (
                        <li
                            key={loc.id}
                            role="option"
                            aria-selected={idx === activeIndex}
                            className={`flex items-center gap-2 px-4 py-3 text-sm cursor-pointer transition-colors ${
                                idx === activeIndex
                                    ? "bg-(--color-bg)"
                                    : "hover:bg-(--color-bg)"
                            } text-(--color-text-primary)`}
                            onMouseDown={() => handleSelect(loc)}
                            onMouseEnter={() => setActiveIndex(idx)}
                        >
                            <span className="text-(--color-text-secondary) flex-shrink-0">
                                <MapPinIcon />
                            </span>
                            <div className="flex flex-col">
                                <span>{loc.address}</span>
                                {loc.city !== loc.address && (
                                    <span className="text-xs text-(--color-text-secondary)">
                                        {loc.city}
                                    </span>
                                )}
                            </div>
                            <span className="ml-auto text-xs font-medium text-(--color-text-secondary) bg-(--color-bg) px-2 py-1 rounded-md">
                                {loc.countryCode}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
