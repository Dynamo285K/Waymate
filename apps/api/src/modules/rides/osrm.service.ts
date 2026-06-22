import polyline from "@mapbox/polyline";
import * as h3 from "h3-js";

import { logger } from "../../shared/logger";

export const fetchOsrmRouteCells = async (
    stops: { lat: number; lng: number }[]
): Promise<{
    cells: { h3Res7: string; lat: number; lng: number; pointOrder: number }[];
    durations: number[];
}> => {
    if (stops.length < 2) return { cells: [], durations: [] };

    // OSRM expects: longitude,latitude separated by semicolon
    const coordinates = stops.map((s) => `${s.lng},${s.lat}`).join(";");
    const url = `http://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=polyline`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            logger.error(
                { status: response.status, body: await response.text() },
                "osrm_fetch_failed"
            );
            return { cells: [], durations: [] };
        }

        type OsrmLeg = { duration: number };
        type OsrmResponse = {
            code: string;
            routes: { geometry: string; legs: OsrmLeg[] }[];
        };
        const data = (await response.json()) as OsrmResponse;
        if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
            return { cells: [], durations: [] };
        }

        const durations = data.routes[0].legs.map((leg) => leg.duration);

        const encodedGeometry = data.routes[0].geometry;
        const decodedPoints = polyline.decode(encodedGeometry); // returns [[lat, lng]]

        const uniqueCells = new Set<string>();
        const cells: {
            h3Res7: string;
            lat: number;
            lng: number;
            pointOrder: number;
        }[] = [];
        let order = 0;

        for (const [lat, lng] of decodedPoints) {
            const cell = h3.latLngToCell(lat, lng, 7);
            if (!uniqueCells.has(cell)) {
                uniqueCells.add(cell);
                cells.push({
                    h3Res7: cell,
                    lat,
                    lng,
                    pointOrder: order++,
                });
            }
        }

        return { cells, durations };
    } catch (e) {
        logger.error({ err: e }, "osrm_parse_failed");
        return { cells: [], durations: [] };
    }
};
