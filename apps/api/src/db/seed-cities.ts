// Seeds the `cities` reference table from GeoNames country dumps.
// Idempotent — TRUNCATE + INSERT on every run, so re-running picks up
// fresh GeoNames data and any new NAME_OVERRIDES.
//
// Usage: bun run --cwd apps/api seed:cities
//
// IMPORTANT: also truncates rides + ride_stops + prices + bookings + their
// status history. ride_stops references cities(id), so CASCADE through it
// is unavoidable; rides is listed alongside so we don't leave zombie ride
// rows that point at deleted stops. Run `bun run --cwd apps/api seed`
// afterwards to repopulate the dev fixtures. Acceptable for local dev; a
// shared environment needs a diff-based sync (UPSERT new + DELETE only
// unused cities) instead.
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
    await mkdir(CACHE_DIR, { recursive: true }).catch(
        (e: NodeJS.ErrnoException) => {
            if (e.code !== "EEXIST") throw e;
        }
    );
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
    if (process.platform === "win32") {
        // On Windows use .NET ZipFile via PowerShell — no unzip needed.
        const script = [
            "Add-Type -Assembly System.IO.Compression.FileSystem;",
            `$zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPath.replace(/\\/g, "\\\\")}');`,
            `$entry = $zip.GetEntry('${country}.txt');`,
            "$reader = [System.IO.StreamReader]::new($entry.Open());",
            "$reader.ReadToEnd();",
            "$reader.Close();",
            "$zip.Dispose();",
        ].join(" ");
        const proc = Bun.spawn(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
            { stdout: "pipe", stderr: "pipe" }
        );
        const text = await new Response(proc.stdout).text();
        const exit = await proc.exited;
        if (exit !== 0) {
            const err = await new Response(proc.stderr).text();
            throw new Error(
                `PowerShell unzip ${zipPath} failed (exit ${exit}): ${err}`
            );
        }
        return text;
    }

    // Unix: `unzip -p` streams the entry to stdout — no temp file needed.
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
// Raw row including featureCode so we can impute missing populations
type RawRow = CityRow & { featureCode: string | null };

const parseTsv = (tsv: string, country: CountryCode): RawRow[] => {
    const out: RawRow[] = [];
    for (const line of tsv.split("\n")) {
        if (!line) continue;
        const cols = line.split("\t");
        if (cols.length < 19) continue;

        const featureClass = cols[6];
        const featureCode = cols[7] ?? null;
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
            featureCode,
        });
    }
    return out;
};

// GeoNames sometimes lists the same place under multiple feature codes
// (a town and its admin-seat alias). Collapse to one row per
// (name_normalized, country_code) — the unique constraint requires it.
// Dedupe raw rows, preferring the row with the largest (non-zero) population
const dedupeRaw = (rows: RawRow[]): RawRow[] => {
    const winners = new Map<string, RawRow>();
    for (const row of rows) {
        const key = `${row.nameNormalized}|${row.countryCode}`;
        const prev = winners.get(key);
        if (!prev) {
            winners.set(key, row);
            continue;
        }
        const prevPop = prev.population ?? 0;
        const curPop = row.population ?? 0;
        // Prefer larger population; if equal prefer non-zero; otherwise keep prev
        if (
            curPop > prevPop ||
            (curPop === prevPop && curPop > 0 && prevPop === 0)
        ) {
            winners.set(key, row);
        }
    }
    return [...winners.values()];
};

// Compute median helper
const median = (arr: number[]) => {
    if (!arr.length) return 0;
    const s = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? Math.round((s[mid - 1] + s[mid]) / 2) : s[mid];
};

async function main() {
    try {
        // Collect deduped raw rows from all countries first so we can
        // compute population statistics and impute missing values.
        const allRaw: RawRow[] = [];

        for (const country of COUNTRIES) {
            console.log(`Processing ${country}...`);
            const zipPath = await downloadIfMissing(country);
            const tsv = await extractTsv(zipPath, country);
            const parsed = parseTsv(tsv, country);
            const deduped = dedupeRaw(parsed);
            console.log(
                `  ${country}: ${parsed.length} populated places → ${deduped.length} after dedup`
            );
            allRaw.push(...deduped);
        }

        // Build per-featureCode population arrays (only non-zero values)
        const popByFeature = new Map<string, number[]>();
        const overallPops: number[] = [];
        for (const r of allRaw) {
            const p = r.population ?? 0;
            if (p > 0) {
                overallPops.push(p);
                if (r.featureCode) {
                    const arr = popByFeature.get(r.featureCode) ?? [];
                    arr.push(p);
                    popByFeature.set(r.featureCode, arr);
                }
            }
        }

        const medianByFeature = new Map<string, number>();
        for (const [k, arr] of popByFeature.entries()) {
            medianByFeature.set(k, median(arr));
        }
        const overallMedian = median(overallPops) || 1000;

        // sensible fallbacks when no median exists for a feature code
        const FALLBACK_BY_FEATURE: Record<string, number> = {
            PPLC: 200000,
            PPLA: 30000,
            PPLA2: 10000,
            PPLA3: 5000,
            PPLA4: 2000,
            PPLG: 2000,
            PPLS: 1000,
            PPL: 1500,
        };

        // Map RawRow -> CityRow with imputed population
        const all: CityRow[] = allRaw.map((r) => {
            let pop = r.population ?? 0;
            if (!pop || pop <= 0) {
                const med = r.featureCode
                    ? medianByFeature.get(r.featureCode)
                    : undefined;
                pop =
                    med && med > 0
                        ? med
                        : (FALLBACK_BY_FEATURE[r.featureCode ?? ""] ??
                          overallMedian);
            }
            return {
                externalId: r.externalId,
                name: r.name,
                nameNormalized: r.nameNormalized,
                countryCode: r.countryCode,
                lat: r.lat,
                lng: r.lng,
                population: pop,
            } as CityRow;
        });

        // Reset to "current GeoNames + overrides" rather than upserting:
        // cities has TWO unique constraints (external_id and
        // (name_normalized, country_code)) and Postgres ON CONFLICT only
        // resolves one. CASCADE wipes ride_stops (and through it prices +
        // bookings); we list `rides` explicitly so re-running this seed
        // does not leave orphan rides whose stops were just truncated.
        console.log(
            `Truncating cities + rides (CASCADE) and inserting ${all.length} rows (batch size ${BATCH_SIZE})...`
        );
        await db.execute(
            sql`TRUNCATE TABLE cities, rides RESTART IDENTITY CASCADE`
        );
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
