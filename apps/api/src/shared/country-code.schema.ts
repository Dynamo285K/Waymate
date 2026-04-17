import { z } from "zod";

export const CountryCodes = [
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "GR",
    "HU",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE",
    "IS",
    "LI",
    "NO",
    "CH",
] as const;

export const CountryCodeSchema = z.enum(CountryCodes);
export type CountryCode = z.infer<typeof CountryCodeSchema>;

// Mutable list for API responses that expect `CountryCode[]`.
export const CountryCodeList: CountryCode[] = [...CountryCodes];
