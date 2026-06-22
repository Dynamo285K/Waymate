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
    osm_key?: string;
    osm_value?: string;
    score: number;
};

type PhotonFeature = {
    geometry: { coordinates: [number, number] }; // [lng, lat]
    properties: {
        osm_id: number;
        osm_type: string;
        osm_key?: string;
        osm_value?: string;
        type?: string;
        countrycode?: string;
        city?: string;
        town?: string;
        village?: string;
        district?: string;
        locality?: string;
        name?: string;
        street?: string;
        housenumber?: string;
        state?: string;
        extent?: [number, number, number, number] | null;
    };
};

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const dLat = lat1 - lat2;
    const dLon = (lon1 - lon2) * Math.cos(((lat1 + lat2) * Math.PI) / 360);
    return Math.sqrt(dLat * dLat + dLon * dLon) * 111;
}

function calculateScore(
    f: PhotonFeature,
    distanceKm: number | null,
    query: string
): number {
    let score = 0;
    const { osm_key, osm_value } = f.properties;

    // Boost score for exact city match
    const normalizedQuery = query.toLowerCase();
    const city = (
        f.properties.city ||
        f.properties.town ||
        f.properties.village ||
        ""
    ).toLowerCase();
    if (city && normalizedQuery.includes(city)) {
        score += 50;
    }

    if (
        osm_key === "place" &&
        ["city", "town", "village"].includes(osm_value || "")
    ) {
        score += 200;
    } else if (osm_key === "aeroway" && osm_value === "aerodrome") {
        score += 100;
    } else if (osm_key === "railway" && osm_value === "station") {
        score += 100;
    } else if (osm_key === "amenity" && osm_value === "bus_station") {
        score += 100;
    } else if (
        osm_key === "amenity" &&
        ["hospital", "clinic", "university"].includes(osm_value || "")
    ) {
        score += 90;
    } else if (
        osm_key === "shop" &&
        ["mall", "supermarket"].includes(osm_value || "")
    ) {
        score += 90;
    } else if (
        osm_key === "amenity" &&
        ["fuel", "parking"].includes(osm_value || "")
    ) {
        score += 80;
    } else if (
        osm_key === "railway" &&
        ["stop", "platform"].includes(osm_value || "")
    ) {
        score += 60;
    } else if (osm_key === "highway" && osm_value === "bus_stop") {
        score += 60;
    } else if (osm_key === "place" && osm_value === "suburb") {
        score += 50;
    } else if (osm_key === "highway" && !f.properties.housenumber) {
        score += 40;
    } else if (f.properties.housenumber || f.properties.type === "house") {
        score += 10;
    }

    if (distanceKm !== null) {
        score -= distanceKm * 0.5; // Slight distance penalty
    }

    return score;
}

export async function fetchPhotonLocations(
    query: string,
    bias?: { lat: number; lng: number } | null
): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) return [];
    try {
        let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=100`;

        if (bias) {
            url += `&lat=${bias.lat}&lon=${bias.lng}`;
        }

        const res = await fetch(url);
        if (!res.ok) return [];
        const data = (await res.json()) as { features: PhotonFeature[] };

        let features = data.features;
        const hasDigits = /\d/.test(query);

        features = features.filter((f) => {
            const { osm_key, osm_value, name, street, housenumber } =
                f.properties;

            // 1. Block "invisible" objects
            if (!name && !street) return false;

            let isAllowed = false;

            // 2. Strategic POIs are always allowed
            if (
                osm_key === "place" &&
                ["city", "town", "village", "suburb"].includes(osm_value || "")
            )
                isAllowed = true;
            if (
                osm_key === "amenity" &&
                [
                    "fuel",
                    "bus_station",
                    "parking",
                    "hospital",
                    "clinic",
                    "university",
                ].includes(osm_value || "")
            )
                isAllowed = true;
            if (
                osm_key === "shop" &&
                ["mall", "supermarket"].includes(osm_value || "")
            )
                isAllowed = true;
            if (
                osm_key === "railway" &&
                ["station", "stop", "platform"].includes(osm_value || "")
            )
                isAllowed = true;
            if (osm_key === "public_transport" && osm_value === "station")
                isAllowed = true;
            if (osm_key === "park_ride" && osm_value === "yes")
                isAllowed = true;
            if (osm_key === "aeroway" && osm_value === "aerodrome")
                isAllowed = true;

            // 3. Streets are always allowed
            if (osm_key === "highway") {
                const invalidRoadTypes = [
                    "cycleway",
                    "footway",
                    "path",
                    "steps",
                    "pedestrian",
                    "via_ferrata",
                    "track",
                ];
                if (!invalidRoadTypes.includes(osm_value || "")) {
                    isAllowed = true;
                }
            }

            // 4. Specific addresses are only allowed if the query contains digits
            if (hasDigits && housenumber) {
                isAllowed = true;
            }

            return isAllowed;
        });

        const dedupMap = new Map<string, LocationSuggestion>();

        for (const f of features) {
            if (
                !f.properties.countrycode &&
                !f.properties.city &&
                !f.properties.state
            )
                continue;

            const countryCode = (f.properties.countrycode?.toUpperCase() ||
                "SK") as CountryCode;
            const isCityNode =
                f.properties.osm_key === "place" &&
                ["city", "town", "village", "suburb"].includes(
                    f.properties.osm_value || ""
                );
            const city = isCityNode
                ? f.properties.name || ""
                : f.properties.city ||
                  f.properties.town ||
                  f.properties.village ||
                  f.properties.state ||
                  f.properties.name ||
                  "";

            let address = f.properties.name || city;
            if (f.properties.street) {
                const streetAndNumber = f.properties.housenumber
                    ? `${f.properties.street} ${f.properties.housenumber}`
                    : f.properties.street;

                address =
                    f.properties.name &&
                    f.properties.name !== f.properties.street
                        ? `${f.properties.name}, ${streetAndNumber}`
                        : streetAndNumber;
            } else if (
                f.properties.name &&
                (f.properties.district || f.properties.locality)
            ) {
                const area = f.properties.district || f.properties.locality;
                address = `${f.properties.name}, ${area}`;
            }

            // Clean up redundant brackets and duplicate cities
            if (address.includes(`(${city})`)) {
                address = address.replace(`(${city})`, "").trim();
            }
            if (address.endsWith(`, ${city}`)) {
                address = address.slice(0, -(city.length + 2));
            }

            // If searching for a city, use only the city name
            if (
                f.properties.osm_key === "place" &&
                ["city", "town", "village"].includes(
                    f.properties.osm_value || ""
                )
            ) {
                address = f.properties.name || city;
            }

            const [lng, lat] = f.geometry.coordinates;
            let featureExtent = f.properties.extent || null;
            if (featureExtent && featureExtent.length === 4) {
                featureExtent = [
                    featureExtent[0],
                    featureExtent[1],
                    featureExtent[2],
                    featureExtent[3],
                ];
            }

            const distanceKm = bias
                ? getDistanceKm(lat, lng, bias.lat, bias.lng)
                : null;
            const score = calculateScore(f, distanceKm, query);

            const suggestion: LocationSuggestion = {
                id: f.properties.osm_id.toString(),
                address,
                city,
                countryCode,
                lat,
                lng,
                extent: featureExtent,
                type: f.properties.type,
                osm_key: f.properties.osm_key,
                osm_value: f.properties.osm_value,
                score,
            };

            const dedupKey = `${address}|${city}`;

            let isDuplicate = false;

            // 1. Deduplicate by exact key
            const existingExact = dedupMap.get(dedupKey);
            if (existingExact) {
                isDuplicate = true;
                const hasNumberOld = /\d/.test(existingExact.address);
                const hasNumberNew = !!f.properties.housenumber;
                if (hasNumberNew && !hasNumberOld) {
                    dedupMap.set(dedupKey, suggestion);
                } else if (!existingExact.extent && suggestion.extent) {
                    dedupMap.set(dedupKey, suggestion);
                }
            }

            // 2. Spatial deduplication for nearby POIs (within 50 meters)
            if (!isDuplicate) {
                const isPoiNew = !!f.properties.name;
                for (const [existingKey, existing] of dedupMap.entries()) {
                    const isPoiOld = existingKey.includes("|");
                    const dist = getDistanceKm(
                        suggestion.lat,
                        suggestion.lng,
                        existing.lat,
                        existing.lng
                    );

                    if (dist < 0.05 && isPoiNew && isPoiOld) {
                        isDuplicate = true;
                        // Keep the record with the higher score or longer address
                        if (
                            suggestion.score > existing.score ||
                            (suggestion.score === existing.score &&
                                suggestion.address.length >
                                    existing.address.length)
                        ) {
                            dedupMap.delete(existingKey);
                            dedupMap.set(dedupKey, suggestion);
                        }
                        break;
                    }
                }
            }

            if (!isDuplicate) {
                dedupMap.set(dedupKey, suggestion);
            }
        }

        const suggestions = Array.from(dedupMap.values());

        // Sort by custom ranking system
        suggestions.sort((a, b) => b.score - a.score);

        return suggestions.slice(0, 8);
    } catch {
        return [];
    }
}
