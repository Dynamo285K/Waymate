import type { CountryCode } from "@repo/shared";

export type LocationSuggestion = {
    id: string;
    address: string;
    city: string;
    countryCode: CountryCode;
    lat: number;
    lng: number;
    extent?: [number, number, number, number] | null;
    type?: string;
    score: number; // Mapbox returns pre-sorted results, we can just assign arbitrary scores or use relevance.
};

type MapboxFeature = {
    id: string;
    text: string;
    place_name: string;
    relevance: number;
    center: [number, number]; // [lng, lat]
    bbox?: [number, number, number, number];
    context?: Array<{
        id: string;
        short_code?: string;
        text: string;
    }>;
};

export async function fetchMapboxLocations(
    query: string,
    bias?: { lat: number; lng: number } | null,
    language?: string,
    signal?: AbortSignal
): Promise<LocationSuggestion[]> {
    if (!query || query.length < 3) return [];

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) {
        console.error(
            "Missing VITE_MAPBOX_ACCESS_TOKEN in environment variables"
        );
        return [];
    }

    try {
        const url = new URL(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                query
            )}.json`
        );
        url.searchParams.set("access_token", token);
        url.searchParams.set("autocomplete", "true");
        // Focus on practical places for a carpooling app
        url.searchParams.set(
            "types",
            "place,locality,neighborhood,address,poi"
        );

        if (language) {
            url.searchParams.set("language", language); // Prefer user's language, fallback to local name
        }

        if (bias) {
            url.searchParams.set("proximity", `${bias.lng},${bias.lat}`);
        }

        const res = await fetch(url.toString(), { signal });
        if (!res.ok) return [];

        const data = (await res.json()) as { features: MapboxFeature[] };

        return data.features.map((f): LocationSuggestion => {
            const [lng, lat] = f.center;

            // Extract country code from context
            const countryContext = f.context?.find((c) =>
                c.id.startsWith("country")
            );
            const countryCode = (countryContext?.short_code?.toUpperCase() ||
                "SK") as CountryCode;

            // Extract city from context or self
            let city = "";
            if (f.id.startsWith("place")) {
                city = f.text;
            } else {
                const placeContext = f.context?.find((c) =>
                    c.id.startsWith("place")
                );
                if (placeContext) {
                    city = placeContext.text;
                }
            }

            // Clean up place_name if it includes redundant country
            let address = f.place_name;
            const countryName = countryContext?.text;
            if (countryName && address.endsWith(`, ${countryName}`)) {
                address = address.slice(0, -(countryName.length + 2));
            }

            return {
                id: f.id,
                address,
                city: city || f.text,
                countryCode,
                lat,
                lng,
                extent: f.bbox ?? null,
                type: f.id.split(".")[0],
                score: f.relevance,
            };
        });
    } catch {
        return [];
    }
}
