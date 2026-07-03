import { app } from "../src/index";
import {
    fillMissingComponentSchemas,
    repairRequestBodies,
} from "../src/openapi/post-process";

const res = await app.handle(new Request("http://localhost/openapi/json"));

if (!res.ok) {
    console.error(`Failed to render OpenAPI spec: ${res.status}`);
    process.exit(1);
}

// Repair bodies before filling components so any $refs the repair introduces
// get their schemas rendered too.
const spec = fillMissingComponentSchemas(
    repairRequestBodies(await res.json(), app.getGlobalRoutes())
);
const out = import.meta.dir + "/../openapi.json";
await Bun.write(out, JSON.stringify(spec, null, 2) + "\n");

console.log(`Wrote OpenAPI spec → ${out}`);
process.exit(0);
