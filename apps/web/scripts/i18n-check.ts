import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import enJson from "../src/i18n/locales/en.json";
import csJson from "../src/i18n/locales/cs.json";
import skJson from "../src/i18n/locales/sk.json";

type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [k: string]: JsonValue };

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const IGNORE_DIRS = new Set(["api-client", "node_modules", "i18n"]);

function flatten(
    value: JsonValue,
    prefix = "",
    out = new Map<string, string>()
): Map<string, string> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value)) {
            flatten(v as JsonValue, prefix ? `${prefix}.${k}` : k, out);
        }
    } else {
        out.set(prefix, String(value));
    }
    return out;
}

async function collectSourceFiles(dir: string): Promise<string[]> {
    const out: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        if (IGNORE_DIRS.has(e.name)) continue;
        const full = join(dir, e.name);
        if (e.isDirectory()) out.push(...(await collectSourceFiles(full)));
        else if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) out.push(full);
    }
    return out;
}

const enFlat = flatten(enJson as JsonValue);
const csFlat = flatten(csJson as JsonValue);
const skFlat = flatten(skJson as JsonValue);

const sourceFiles = await collectSourceFiles(SRC_DIR);
const sourceText = (
    await Promise.all(sourceFiles.map((f) => Bun.file(f).text()))
).join("\n");

// Dynamic keys: t(`some.prefix.${expr}...`) — we treat every key under
// `some.prefix` as "used". Conservative but matches how dynamic lookups work.
const dynamicPrefixes = new Set<string>();
for (const m of sourceText.matchAll(/t\(\s*`([a-zA-Z0-9_.]+)\$\{/g)) {
    let p = m[1];
    while (p.endsWith(".")) p = p.slice(0, -1);
    if (p) dynamicPrefixes.add(p);
}

function isUsed(keyPath: string): boolean {
    if (
        sourceText.includes(`"${keyPath}"`) ||
        sourceText.includes(`'${keyPath}'`) ||
        sourceText.includes(`\`${keyPath}\``)
    ) {
        return true;
    }
    for (const prefix of dynamicPrefixes) {
        if (keyPath === prefix || keyPath.startsWith(`${prefix}.`)) return true;
    }
    return false;
}

const enKeys = [...enFlat.keys()];
const csKeys = new Set(csFlat.keys());
const skKeys = new Set(skFlat.keys());
const enKeySet = new Set(enKeys);

const unused = enKeys.filter((k) => !isUsed(k));
const missingInCs = enKeys.filter((k) => !csKeys.has(k));
const missingInSk = enKeys.filter((k) => !skKeys.has(k));
const extraInCs = [...csKeys].filter((k) => !enKeySet.has(k));
const extraInSk = [...skKeys].filter((k) => !enKeySet.has(k));

const banner = (label: string) => `\n=== ${label} ===`;
let failed = false;

if (unused.length) {
    console.error(banner(`Unused keys in en.json (${unused.length})`));
    for (const k of unused) console.error(`  ${k}`);
    failed = true;
} else {
    console.log(
        "OK: all en.json keys are referenced (or under a dynamic prefix)."
    );
}

if (missingInCs.length) {
    console.error(banner(`Missing in cs.json (${missingInCs.length})`));
    for (const k of missingInCs) console.error(`  ${k}`);
    failed = true;
}
if (extraInCs.length) {
    console.error(
        banner(`Extra in cs.json — not in en.json (${extraInCs.length})`)
    );
    for (const k of extraInCs) console.error(`  ${k}`);
    failed = true;
}
if (missingInSk.length) {
    console.error(banner(`Missing in sk.json (${missingInSk.length})`));
    for (const k of missingInSk) console.error(`  ${k}`);
    failed = true;
}
if (extraInSk.length) {
    console.error(
        banner(`Extra in sk.json — not in en.json (${extraInSk.length})`)
    );
    for (const k of extraInSk) console.error(`  ${k}`);
    failed = true;
}

if (
    !missingInCs.length &&
    !extraInCs.length &&
    !missingInSk.length &&
    !extraInSk.length
) {
    console.log("OK: locale parity across en/cs/sk.");
}

process.exit(failed ? 1 : 0);
