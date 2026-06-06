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
    const dLon = (lon1 - lon2) * Math.cos((lat1 + lat2) * Math.PI / 360);
    return Math.sqrt(dLat * dLat + dLon * dLon) * 111;
}

export async function fetchPhotonLocations(
    query: string,
    bias?: { lat: number; lng: number } | null,
    searchType: "city" | "address" = "address",
    parentCity?: LocationSuggestion | null
): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) return [];
    try {
        let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=15`;

        if (searchType === "city") {
            // Prísny filter: vráti len entity, ktoré majú place tag pre mesto, mestečko alebo dedinu.
            url += `&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`;
        } else if (searchType === "address") {
            if (parentCity?.extent) {
                // extent from photon is [minLon, maxLat, maxLon, minLat]
                // bbox for photon needs minLon,minLat,maxLon,maxLat
                url += `&bbox=${parentCity.extent[0]},${parentCity.extent[3]},${parentCity.extent[2]},${parentCity.extent[1]}`;
            } else if (parentCity) {
                // Fallback na 15km okruh ak mesto nemá extent
                const latDelta = 15 / 111;
                const lonDelta = 15 / (111 * Math.cos((parentCity.lat * Math.PI) / 180));
                const minLon = parentCity.lng - lonDelta;
                const maxLon = parentCity.lng + lonDelta;
                const minLat = parentCity.lat - latDelta;
                const maxLat = parentCity.lat + latDelta;
                url += `&bbox=${minLon},${minLat},${maxLon},${maxLat}`;
            } else if (bias) {
                // Fallback na 15km okruh ak mesto nemá extent
                const latDelta = 15 / 111;
                const lonDelta = 15 / (111 * Math.cos((bias.lat * Math.PI) / 180));
                const minLon = bias.lng - lonDelta;
                const maxLon = bias.lng + lonDelta;
                const minLat = bias.lat - latDelta;
                const maxLat = bias.lat + latDelta;
                url += `&bbox=${minLon},${minLat},${maxLon},${maxLat}`;
            }
        }

        if (bias) {
            // Photon uses 'lon' instead of 'lng' for longitude
            url += `&lat=${bias.lat}&lon=${bias.lng}`;
        }

        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json() as { features: PhotonFeature[] };

        let features = data.features;

        // Odfiltrovanie nežiaducich miest a šumu (úrady, reštaurácie, cyklotrasy) pre spolujazdu
        features = features.filter(f => {
            const { osm_key, osm_value } = f.properties;

            // 1. Zákaz cyklotrás a chodníkov (aj keď je to highway)
            const invalidRoadTypes = ["cycleway", "footway", "path", "steps", "pedestrian", "via_ferrata", "track"];
            if (osm_value && invalidRoadTypes.includes(osm_value)) return false;

            // 2. Zákaz úradov a administratívy
            if (osm_key === "office" || osm_key === "information" || osm_key === "historic") return false;
            const invalidBuildings = ["government", "public", "civic", "commercial", "retail"];
            if (osm_value && invalidBuildings.includes(osm_value)) return false;

            // 3. Zákaz územných celkov. Ak hľadáme adresu, zakážeme aj samotné mestá.
            if (osm_key === "place") {
                let invalidPlaces = ["district", "county", "state", "region", "country", "municipality"];
                if (searchType === "address") {
                    // Ak hľadáme adresu, vyhodíme aj mestá a dediny (môžu ostať len štvrte a ulice)
                    invalidPlaces = [...invalidPlaces, "city", "town", "village", "hamlet"];
                }
                if (osm_value && invalidPlaces.includes(osm_value)) return false;
            }

            // 4. Ak je to špecifický POI, povolíme len strategické miesta na vyzdvihnutie
            let isAllowedPoi = false;
            if (osm_key === "amenity" && ["fuel", "bus_station", "parking"].includes(osm_value || "")) isAllowedPoi = true;
            if (osm_key === "railway" && osm_value === "station") isAllowedPoi = true;
            if (osm_key === "highway" && osm_value === "bus_stop") isAllowedPoi = true;
            if (osm_key === "aeroway" && osm_value === "aerodrome") isAllowedPoi = true;
            if (osm_key === "shop" && ["mall", "supermarket"].includes(osm_value || "")) isAllowedPoi = true;
            if (osm_key === "tourism" && osm_value === "hotel") isAllowedPoi = true;

            // PURE WHITELIST: Pustíme len bezpečné kľúče (cesty, miesta, budovy) alebo povolené POI
            const safeKeys = ["highway", "place", "building"];

            if (isAllowedPoi) {
                return true; // Povolené strategické miesta vždy prejdú
            } else if (osm_key && safeKeys.includes(osm_key)) {
                return true; // Bežné ulice a domy prejdú
            } else {
                return false; // Všetko ostatné (man_made, natural, waterway, nezmysly) nemilosrdne zablokujeme
            }
        });

        const dedupMap = new Map<string, LocationSuggestion>();
        const seenCityKeys = new Map<string, LocationSuggestion>();

        for (const f of features) {
            // Ak nemáme krajinu ani mesto, zrejme ide o neplatný údaj
            if (!f.properties.countrycode && !f.properties.city) continue;

            // Ignorovanie samotných štátov a krajov, ak nehľadáme vyslovene mesto
            if (f.properties.osm_key === "boundary" && searchType === "address") {
                continue;
            }

            const countryCode = (f.properties.countrycode?.toUpperCase() || "SK") as CountryCode;

            // Ochrana proti iným mestám vo vnútri rovnakého obdĺžnika (napr. Vrútky vnútri Martina)
            if (searchType === "address" && parentCity) {
                const explicitCity = f.properties.city || f.properties.town || f.properties.village;
                const pCity = parentCity.city;
                const pAddress = parentCity.address;

                // Ak výsledok patrí do úplne iného mesta, zahodíme ho
                if (explicitCity && explicitCity !== pCity && explicitCity !== pAddress &&
                    !explicitCity.includes(pCity) && !pCity.includes(explicitCity) &&
                    !explicitCity.includes(pAddress) && !pAddress.includes(explicitCity)) {
                    continue;
                }
            }

            const city = f.properties.city || f.properties.state || f.properties.name || "";

            let address = f.properties.name || city;
            if (f.properties.street) {
                const streetAndNumber = f.properties.housenumber
                    ? `${f.properties.street} ${f.properties.housenumber}`
                    : f.properties.street;

                address = f.properties.name && f.properties.name !== f.properties.street
                    ? `${f.properties.name}, ${streetAndNumber}`
                    : streetAndNumber;
            } else if (f.properties.name && (f.properties.district || f.properties.locality)) {
                // Ak nemáme presnú ulicu, ale máme aspoň štvrť alebo oblasť, pripojíme to,
                // aby sme odlíšili napr. tri pumpy Slovnaft v tom istom meste.
                const area = f.properties.district || f.properties.locality;
                address = `${f.properties.name}, ${area}`;
            }

            const featureExtent = f.properties.extent as [number, number, number, number] | undefined;
            const lng = f.geometry.coordinates[0];
            const lat = f.geometry.coordinates[1];

            const suggestion: LocationSuggestion = {
                id: `${f.properties.osm_type}-${f.properties.osm_id}`,
                address,
                city,
                countryCode,
                lat,
                lng,
                extent: featureExtent,
                type: f.properties.type,
            };

            if (searchType === "city") {
                const key = `${f.properties.name || ""}-${countryCode}`;
                const existing = seenCityKeys.get(key);

                if (!existing) {
                    seenCityKeys.set(key, suggestion);
                } else if (!existing.extent && suggestion.extent) {
                    seenCityKeys.set(key, suggestion);
                }
            } else {
                // Chytrá deduplikácia pre adresy a POI
                let dedupKey = address;
                if (f.properties.name) {
                    dedupKey = `${f.properties.name}|${f.properties.street || ''}|${city}`;
                }

                const existing = dedupMap.get(dedupKey);
                if (existing) {
                    // Ak už máme záznam, chceme si nechať ten s popisným číslom
                    const hasNumberOld = /\\d/.test(existing.address);
                    const hasNumberNew = !!f.properties.housenumber;
                    if (hasNumberNew && !hasNumberOld) {
                        dedupMap.set(dedupKey, suggestion);
                    }
                    continue;
                }

                dedupMap.set(dedupKey, suggestion);
            }
        }

        let suggestions: LocationSuggestion[] = [];
        if (searchType === "city") {
            suggestions = Array.from(seenCityKeys.values());
        } else {
            suggestions = Array.from(dedupMap.values());
        }

        if (bias) {
            // Prísne lokálne zoradenie podľa vzdialenosti k bias polohe
            suggestions.sort((a, b) => {
                const distA = getDistanceKm(a.lat, a.lng, bias.lat, bias.lng);
                const distB = getDistanceKm(b.lat, b.lng, bias.lat, bias.lng);
                return distA - distB;
            });
        }

        return suggestions.slice(0, 8);
    } catch {
        return [];
    }
}
