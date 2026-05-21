import { useState, useRef, useEffect } from "react";
import { Input, MapPinIcon } from "@waymate/ui";
import { getCities } from "../api-client/cities/cities";
import type { CityListItem } from "../api-client/model/cityListItem";

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 2;

export type { CityListItem };

type CitySelectProps = {
    value: CityListItem | null;
    onChange: (city: CityListItem | null) => void;
    placeholder?: string;
    label?: string;
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

export function CitySelect({
    value,
    onChange,
    placeholder = "Search city…",
    label,
}: CitySelectProps) {
    const [inputValue, setInputValue] = useState(value?.name ?? "");
    const [suggestions, setSuggestions] = useState<CityListItem[]>([]);
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);

    // Sync the displayed text when the selected city changes externally.
    // Adjusting during render (tracking the previous id) avoids a
    // setState-in-effect cascade.
    const [prevValueId, setPrevValueId] = useState(value?.id);
    if (value?.id !== prevValueId) {
        setPrevValueId(value?.id);
        setInputValue(value?.name ?? "");
    }

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
                setInputValue(value?.name ?? "");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [value?.name]);

    useEffect(() => {
        // Short queries are cleared synchronously in `handleChange`; nothing
        // to fetch here. Bailing out keeps all setState calls inside the async
        // timer callback (never synchronous in the effect body).
        if (inputValue.length < MIN_QUERY_LENGTH) return;
        if (value && inputValue === value.name) return;

        const id = ++requestIdRef.current;

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const results = await getCities({ q: inputValue, limit: 8 });
                if (id !== requestIdRef.current) return;
                setSuggestions(results);
                setOpen(results.length > 0);
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
    }, [inputValue, value?.name]);

    function handleSelect(city: CityListItem) {
        onChange(city);
        setInputValue(city.name);
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
            const city = suggestions[activeIndex];
            if (city) handleSelect(city);
        } else if (e.key === "Escape") {
            setOpen(false);
            setInputValue(value?.name ?? "");
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
                    {suggestions.map((city, idx) => (
                        <li
                            key={city.id}
                            role="option"
                            aria-selected={idx === activeIndex}
                            className={`flex items-center gap-2 px-4 py-3 text-sm cursor-pointer transition-colors ${
                                idx === activeIndex
                                    ? "bg-(--color-bg)"
                                    : "hover:bg-(--color-bg)"
                            } text-(--color-text-primary)`}
                            onMouseDown={() => handleSelect(city)}
                            onMouseEnter={() => setActiveIndex(idx)}
                        >
                            <span className="text-(--color-text-secondary) flex-shrink-0">
                                <MapPinIcon />
                            </span>
                            <span>{city.name}</span>
                            <span className="ml-auto text-xs text-(--color-text-secondary)">
                                {city.countryCode}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
