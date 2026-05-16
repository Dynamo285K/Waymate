// Seeds the `cities` reference table from GeoNames country dumps.
// Idempotent — TRUNCATE + INSERT on every run, so re-running picks up
// fresh GeoNames data and any new NAME_OVERRIDES.
//
// Usage: bun run --cwd apps/api seed:cities
//
// Data: GeoNames country dumps (https://download.geonames.org/export/dump/),
// CC BY 4.0. ZIPs are cached in apps/api/.geonames-cache/ between runs.
import { sql } from "drizzle-orm";
import { mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { CountryCode } from "@repo/shared";
import { db } from "./index";
import { cities } from "./schema";
import { normalizeForSearch } from "../shared/text-normalize";

const CACHE_DIR = join(import.meta.dir, "../../.geonames-cache");
const COUNTRIES: readonly CountryCode[] = ["SK", "CZ"] as const;

// Populated-place feature codes worth surfacing in city autocomplete.
// PPL = generic populated place, PPLA* = admin-division seats, PPLC = country capital.
// Excludes PPLX (sections of cities), PPLW (destroyed), PPLF (farms).
// See https://www.geonames.org/export/codes.html.
const ALLOWED_FEATURE_CODES = new Set([
    "PPL",
    "PPLA",
    "PPLA2",
    "PPLA3",
    "PPLA4",
    "PPLC",
    "PPLG",
    "PPLS",
]);

const BATCH_SIZE = 500;

// GeoNames primary `name` is occasionally the English exonym for famous
// cities even in country dumps. Override by geonameId so the displayed
// label matches what local users actually type. Only needed for SK/CZ
// outliers — ordinary places already carry the local form.
const NAME_OVERRIDES = new Map<number, string>([
    [3067696, "Praha"], // GeoNames "Prague"
    [3068160, "Plzeň"], // GeoNames "Pilsen"
]);

type CityRow = typeof cities.$inferInsert;

const downloadIfMissing = async (country: string): Promise<string> => {
    await mkdir(CACHE_DIR, { recursive: true });
    const zipPath = join(CACHE_DIR, `${country}.zip`);
    const cached = await stat(zipPath).catch(() => null);
    if (cached) {
        return zipPath;
    }
    const url = `https://download.geonames.org/export/dump/${country}.zip`;
    console.log(`  Fetching ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(
            `Failed to download ${country}.zip: ${res.status} ${res.statusText}`
        );
    }
    await Bun.write(zipPath, res);
    return zipPath;
};

const extractTsv = async (
    zipPath: string,
    country: string
): Promise<string> => {
    // GeoNames country zips contain a single `<COUNTRY>.txt` TSV.
    // `unzip -p` streams it to stdout — no temp file needed.
    const proc = Bun.spawn(["unzip", "-p", zipPath, `${country}.txt`], {
        stdout: "pipe",
        stderr: "pipe",
    });
    const text = await new Response(proc.stdout).text();
    const exit = await proc.exited;
    if (exit !== 0) {
        const err = await new Response(proc.stderr).text();
        throw new Error(`unzip ${zipPath} failed (exit ${exit}): ${err}`);
    }
    return text;
};

// Drizzle's `.values()` rejects empty arrays; filter callers must check.
const parseTsv = (tsv: string, country: CountryCode): CityRow[] => {
    const out: CityRow[] = [];
    for (const line of tsv.split("\n")) {
        if (!line) continue;
        const cols = line.split("\t");
        if (cols.length < 19) continue;

        const featureClass = cols[6];
        const featureCode = cols[7];
        if (featureClass !== "P") continue;
        if (!featureCode || !ALLOWED_FEATURE_CODES.has(featureCode)) continue;

        const geonameId = Number(cols[0]);
        const rawName = cols[1] ?? "";
        const name = NAME_OVERRIDES.get(geonameId) ?? rawName;
        const lat = Number(cols[4]);
        const lng = Number(cols[5]);
        const population = Number(cols[14]);

        if (!Number.isFinite(geonameId) || geonameId <= 0) continue;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (!name) continue;

        // Normalize from the overridden name so search keys match the
        // displayed label ("praha" not "prague") for outliers.
        const nameNormalized = normalizeForSearch(name);
        if (!nameNormalized) continue;

        out.push({
            externalId: geonameId,
            name: name.slice(0, 200),
            nameNormalized: nameNormalized.slice(0, 200),
            countryCode: country,
            lat,
            lng,
            population: Number.isFinite(population)
                ? Math.max(0, population)
                : 0,
        });
    }
    return out;
};

// GeoNames sometimes lists the same place under multiple feature codes
// (a town and its admin-seat alias). Collapse to one row per
// (name_normalized, country_code) — the unique constraint requires it.
const dedupe = (rows: CityRow[]): CityRow[] => {
    const winners = new Map<string, CityRow>();
    for (const row of rows) {
        const key = `${row.nameNormalized}|${row.countryCode}`;
        const prev = winners.get(key);
        if (!prev || (row.population ?? 0) > (prev.population ?? 0)) {
            winners.set(key, row);
        }
    }
    return [...winners.values()];
};

async function main() {
    try {
        const all: CityRow[] = [];

        for (const country of COUNTRIES) {
            console.log(`Processing ${country}...`);
            const zipPath = await downloadIfMissing(country);
            const tsv = await extractTsv(zipPath, country);
            const parsed = parseTsv(tsv, country);
            const deduped = dedupe(parsed);
            console.log(
                `  ${country}: ${parsed.length} populated places → ${deduped.length} after dedup`
            );
            all.push(...deduped);
        }

        // Reset to "current GeoNames + overrides" rather than upserting:
        // cities has TWO unique constraints (external_id and
        // (name_normalized, country_code)) and Postgres ON CONFLICT only
        // resolves one. TRUNCATE is safe today because nothing references
        // cities yet — once ride_stops gets a city_id FK, this needs a
        // proper diff-based sync.
        console.log(
            `Truncating cities and inserting ${all.length} rows (batch size ${BATCH_SIZE})...`
        );
        await db.execute(sql`TRUNCATE TABLE cities RESTART IDENTITY`);
        for (let i = 0; i < all.length; i += BATCH_SIZE) {
            const batch = all.slice(i, i + BATCH_SIZE);
            await db.insert(cities).values(batch);
        }

        console.log("Cities seed complete.");
    } catch (error) {
        console.error("Cities seed failed:", error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

main();
