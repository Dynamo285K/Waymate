import postgres from "postgres";

const apiDirUrl = new URL("../apps/api", import.meta.url);

// Single source of truth for the e2e Postgres URL. apps/api/.env points at the
// dev DB (`spolujazda_db`) — we deliberately use a separate database so e2e
// runs never trash the developer's data.
export const E2E_DATABASE_URL =
    (typeof Bun === "undefined" ? undefined : Bun.env.E2E_DATABASE_URL) ??
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

async function runApiScript(
    script: "db:reset"
): Promise<void> {
    if (typeof Bun === "undefined") {
        throw new Error("E2E API setup must be run with Bun");
    }

    const child = Bun.spawn(["bun", "run", script], {
        cwd: Bun.fileURLToPath(apiDirUrl),
        env: { ...Bun.env, DATABASE_URL: E2E_DATABASE_URL },
        stdin: "ignore",
        stdout: "pipe",
        stderr: "pipe",
    });

    const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
    ]);

    if (code !== 0) {
        throw new Error(
            `bun run ${script} exited with code ${code}\n${stdout}${stderr}`
        );
    }
}

export default async function globalSetup(): Promise<void> {
    await recreateDatabase();
    await runApiScript("db:reset");
}

if (import.meta.main) {
    await globalSetup();
}
