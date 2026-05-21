import carsData from "./cars-data.json";

/** One row of the static car brand/model catalog. */
export type CarCatalogEntry = { brand: string; modelName: string };

/**
 * Static car brand/model catalog. Seeded into the `car_models` table
 * (`apps/api/src/db/seed.ts`, test `reset-db.ts`) and used as the offline
 * fallback for the offer-ride / add-car brand & model pickers.
 *
 * Exposed as its own `@repo/shared` subpath — like `validation` — so importing
 * it never drags in the Zod schema graph, and so the web no longer has to
 * reach across the workspace into `apps/api` for it.
 */
export const carCatalog: CarCatalogEntry[] = carsData;
