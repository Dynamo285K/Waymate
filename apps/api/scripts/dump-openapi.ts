import { app } from "../src/index";

// The document is fully post-processed by the app itself (the root
// `.onAfterHandle` in src/index.ts repairs request bodies and fills missing
// component schemas), so this script only persists what the live
// `/openapi/json` route serves.
const res = await app.handle(new Request("http://localhost/openapi/json"));

if (!res.ok) {
    console.error(`Failed to render OpenAPI spec: ${res.status}`);
    process.exit(1);
}

const spec = await res.json();
const out = import.meta.dir + "/../openapi.json";
await Bun.write(out, JSON.stringify(spec, null, 2) + "\n");

console.log(`Wrote OpenAPI spec → ${out}`);
process.exit(0);
