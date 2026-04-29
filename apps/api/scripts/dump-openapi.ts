import { app } from "../src/index";
import { fillMissingComponentSchemas } from "../src/openapi/post-process";

const res = await app.handle(
    new Request("http://localhost/openapi/json")
);

if (!res.ok) {
    console.error(`Failed to render OpenAPI spec: ${res.status}`);
    process.exit(1);
}

const spec = fillMissingComponentSchemas(await res.json());
const out = new URL("../openapi.json", import.meta.url).pathname;
await Bun.write(out, JSON.stringify(spec, null, 2) + "\n");

console.log(`Wrote OpenAPI spec → ${out}`);
process.exit(0);
