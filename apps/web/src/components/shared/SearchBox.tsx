import { useState, useRef, useEffect } from "react";
import type { Locale } from "date-fns";
import { DatePicker } from "@/components/ui/DatePicker";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { MapPinIcon } from "@/components/ui/icons/MapPinIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type SearchBoxLabels = {
    from?: string;
    to?: string;
    search?: string;
    datePlaceholder?: string;
    seats?: string;
};

export type SearchBoxCityOption = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    city?: string;
    address?: string;
    countryCode?: string;
};

export type SearchBoxProps = {
    onSearchCities: (query: string) => Promise<SearchBoxCityOption[]>;
    onSearch: (
        from: SearchBoxCityOption | null,
        to: SearchBoxCityOption | null,
        date: Date | undefined,
        seats: number
    ) => void;
    labels?: SearchBoxLabels;
    locale?: Locale;
    initialSeats?: number;
    maxSeats?: number;
};

type LocationInputProps = {
    placeholder: string;
    selected: SearchBoxCityOption | null;
    onSelect: (city: SearchBoxCityOption | null) => void;
    onSearchCities: (query: string) => Promise<SearchBoxCityOption[]>;
    icon: "dot" | "pin";
};

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 2;

function isValidSeatValue(value: string, maxSeats: number) {
    if (value === "") return true;
    if (!/^\d+$/.test(value)) return false;

    const numericValue = Number(value);
    return numericValue >= 1 && numericValue <= maxSeats;
}

function getInitialSeatValue(initialSeats: number, maxSeats: number) {
    if (initialSeats < 1 || initialSeats > maxSeats) return 1;
    return initialSeats;
}

function LocationInput({
    placeholder,
    selected,
    onSelect,
    onSearchCities,
    icon,
}: LocationInputProps) {
    const [inputValue, setInputValue] = useState(selected?.name ?? "");
    const [suggestions, setSuggestions] = useState<SearchBoxCityOption[]>([]);
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const ref = useRef<HTMLDivElement>(null);
    const requestIdRef = useRef(0);
    const onSearchCitiesRef = useRef(onSearchCities);
    onSearchCitiesRef.current = onSearchCities;

    useEffect(() => {
        setInputValue(selected?.name ?? "");
    }, [selected?.id]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setInputValue(selected?.name ?? "");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [selected?.name]);

    useEffect(() => {
        if (inputValue.length < MIN_QUERY_LENGTH) {
            setSuggestions([]);
            setOpen(false);
            setIsLoading(false);
            return;
        }

        if (selected && inputValue === selected.name) return;

        setIsLoading(true);
        const id = ++requestIdRef.current;

        const timer = setTimeout(async () => {
            try {
                const results = await onSearchCitiesRef.current(inputValue);
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
    }, [inputValue, selected?.name]);

    function handleSelect(city: SearchBoxCityOption) {
        onSelect(city);
        setInputValue(city.name);
        setSuggestions([]);
        setOpen(false);
        setActiveIndex(-1);
    }

    function handleInputChange(value: string) {
        setInputValue(value);
        if (!value) onSelect(null);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!open) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                handleSelect(suggestions[activeIndex]);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
            setInputValue(selected?.name ?? "");
        }
    }

    return (
        <div
            className="relative"
            ref={ref}
        >
            <div className="flex items-center gap-3 py-3.5 px-4 [&_svg]:w-4 [&_svg]:h-4 [&_svg]:text-text-secondary [&_svg]:shrink-0">
                {icon === "dot" ? (
                    <span className="w-3 h-3 rounded-full border-2 border-text-secondary shrink-0" />
                ) : (
                    <MapPinIcon />
                )}
                <input
                    className="bg-transparent border-0 outline-none text-control text-text-primary w-full placeholder:text-text-secondary"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    aria-autocomplete="list"
                    aria-expanded={open}
                />
                {isLoading && (
                    <span className="w-4 h-4 border-2 border-border border-t-primary rounded-full shrink-0 animate-spin [animation-duration:0.6s]" />
                )}
            </div>
            {open && suggestions.length > 0 && (
                <ul
                    className="absolute top-full left-0 right-0 z-200 bg-card border border-border rounded-xl shadow-dropdown list-none mt-1 p-1.5 overflow-hidden"
                    role="listbox"
                >
                    {suggestions.map((city, idx) => (
                        <li
                            key={city.id}
                            className={`flex items-center gap-2.5 py-2.5 px-3 text-control text-text-primary rounded-lg cursor-pointer transition-[background-color] duration-150 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:text-text-secondary [&_svg]:shrink-0 ${
                                activeIndex === idx
                                    ? "bg-secondary-hover"
                                    : "hover:bg-secondary-hover"
                            }`}
                            role="option"
                            aria-selected={activeIndex === idx}
                            onMouseDown={() => handleSelect(city)}
                            onMouseEnter={() => setActiveIndex(idx)}
                        >
                            <MapPinIcon />
                            {city.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function SearchBox({
    onSearchCities,
    onSearch,
    labels,
    locale,
    initialSeats = 1,
    maxSeats = 8,
}: SearchBoxProps) {
    const [fromCity, setFromCity] = useState<SearchBoxCityOption | null>(null);
    const [toCity, setToCity] = useState<SearchBoxCityOption | null>(null);
    const [date, setDate] = useState<Date | undefined>();
    const initialSeatValue = getInitialSeatValue(initialSeats, maxSeats);
    const [seats, setSeats] = useState(initialSeatValue);
    const [seatInputValue, setSeatInputValue] = useState(
        String(initialSeatValue)
    );

    function handleSeatInputChange(value: string) {
        if (!isValidSeatValue(value, maxSeats)) return;

        setSeatInputValue(value);

        if (value !== "") {
            setSeats(Number(value));
        }
    }

    function restoreSeatInputValue() {
        if (seatInputValue === "") {
            setSeatInputValue(String(seats));
        }
    }

    return (
        <div className="flex flex-col bg-card border border-border rounded-3xl p-2 w-full max-w-160">
            <LocationInput
                placeholder={labels?.from ?? "Pickup location"}
                selected={fromCity}
                onSelect={setFromCity}
                onSearchCities={onSearchCities}
                icon="dot"
            />
            <div className="h-px bg-border mx-4" />
            <LocationInput
                placeholder={labels?.to ?? "Dropoff location"}
                selected={toCity}
                onSelect={setToCity}
                onSearchCities={onSearchCities}
                icon="pin"
            />
            <div className="h-px bg-border mx-4" />
            <div className="flex items-center gap-2 py-1 px-2">
                <div className="flex-1">
                    <DatePicker
                        placeholder={labels?.datePlaceholder ?? "dd.mm.rr"}
                        value={date}
                        onChange={setDate}
                        locale={locale}
                        disablePastDates
                    />
                </div>
                <div className="flex items-center gap-2 border-l border-border pl-3 shrink-0">
                    <span className="text-xs text-text-secondary whitespace-nowrap">
                        {labels?.seats ?? "Seats"}
                    </span>
                    <Input
                        type="number"
                        min={1}
                        max={maxSeats}
                        value={seatInputValue}
                        onChange={(e) => handleSeatInputChange(e.target.value)}
                        onFocus={(e) => e.currentTarget.select()}
                        onBlur={restoreSeatInputValue}
                        className="w-16"
                    />
                </div>
            </div>
            <Button
                variant="black"
                fullWidth
                onClick={() => onSearch(fromCity, toCity, date, seats)}
            >
                <SearchIcon />
                {labels?.search ?? "Search"}
            </Button>
        </div>
    );
}
