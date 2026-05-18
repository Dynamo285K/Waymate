import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const dir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(dir, "../apps/api");

// Single source of truth for the e2e Postgres URL. apps/api/.env points at the
// dev DB (`spolujazda_db`) — we deliberately use a separate database so e2e
// runs never trash the developer's data.
export const E2E_DATABASE_URL =
    process.env.E2E_DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/spolujazda_e2e_db";

async function recreateDatabase(): Promise<void> {
    const u = new URL(E2E_DATABASE_URL);
    const dbName = u.pathname.replace(/^\//, "");
    if (!dbName) {
        throw new Error(
            `E2E_DATABASE_URL must include a database name, got: ${E2E_DATABASE_URL}`
        );
    }

    // Connect to the maintenance DB to drop/create the e2e DB. CREATE/DROP
    // DATABASE can't run in a transaction and don't accept parameters — the
    // name is quoted by hand. The double-quote escape is a defense in depth
    // even though we only ever supply trusted, hard-coded names.
    const adminUrl = new URL(E2E_DATABASE_URL);
    adminUrl.pathname = "/postgres";

    const admin = postgres(adminUrl.toString(), { max: 1 });
    const quoted = `"${dbName.replace(/"/g, '""')}"`;
    try {
        // FORCE terminates any lingering connections (e.g. a previous failed
        // run whose pool didn't drain) so the DROP doesn't block forever.
        await admin.unsafe(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
        await admin.unsafe(`CREATE DATABASE ${quoted}`);
    } finally {
        await admin.end();
    }
}

function runApiScript(script: "db:migrate" | "seed"): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn("bun", ["run", script], {
            cwd: apiDir,
            // process.env first so Bun's .env loader (which respects existing
            // process.env values) keeps our DATABASE_URL override.
            env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
            stdio: ["ignore", "pipe", "pipe"],
        });

        const buffered: string[] = [];
        child.stdout?.on("data", (chunk: Buffer) =>
            buffered.push(chunk.toString())
        );
        child.stderr?.on("data", (chunk: Buffer) =>
            buffered.push(chunk.toString())
        );

        child.on("error", reject);
        child.on("close", (code) => {
            if (code === 0) return resolve();
            reject(
                new Error(
                    `bun run ${script} exited with code ${code}\n${buffered.join("")}`
                )
            );
        });
    });
}

export default async function globalSetup(): Promise<void> {
    await recreateDatabase();
    await runApiScript("db:migrate");
    await runApiScript("seed");
}
