import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(repoRoot);

const PASS = "PASS";
const FAIL = "FAIL";
const SKIP = "SKIP";

/** @type {{ name: string; status: string; duration: string }[]} */
const results = [];

function run(cmd, args, opts = {}) {
    return spawnSync(cmd, args, {
        cwd: opts.cwd ?? repoRoot,
        encoding: "utf8",
        stdio: opts.capture ? "pipe" : "inherit",
        windowsHide: true,
        env: { ...process.env, ...opts.env },
    });
}

function runOrThrow(cmd, args, opts = {}) {
    const r = run(cmd, args, opts);
    if (r.status !== 0) {
        throw new Error(
            `"${[cmd, ...args].join(" ")}" exited with ${r.status}`
        );
    }
    return r;
}

function job(name, fn) {
    const sep = "─".repeat(60);
    console.log(`\n${sep}`);
    console.log(`▶  ${name}`);
    console.log(sep);
    const start = Date.now();
    try {
        const result = fn();
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        if (result === SKIP) {
            console.log(`\n⏭  ${name} — skipped`);
            results.push({ name, status: SKIP, duration });
        } else {
            console.log(`\n✓  ${name} — ${duration}s`);
            results.push({ name, status: PASS, duration });
        }
    } catch (e) {
        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.error(`\n✗  ${name} — ${duration}s`);
        if (e.message) console.error(`   ${e.message}`);
        results.push({ name, status: FAIL, duration });
    }
}

function isPostgresRunning() {
    const r = run(
        "docker",
        ["compose", "exec", "-T", "db", "pg_isready", "-U", "postgres"],
        { capture: true }
    );
    return r.status === 0;
}

const withE2e = process.argv.includes("--with-e2e");
const skipDb = process.argv.includes("--skip-db");
const dbAvailable = !skipDb && isPostgresRunning();

if (!dbAvailable) {
    console.log(
        "\nℹ  Postgres not running — DB jobs will be skipped.\n   Start it with: bun run db:setup\n"
    );
}

// ── Static checks ────────────────────────────────────────────────────────────

job("lint", () => {
    runOrThrow("bun", ["run", "lint"]);
});

job("format:check", () => {
    runOrThrow("bun", ["run", "format:check"]);
});

job("typecheck", () => {
    runOrThrow("bun", ["run", "typecheck"]);
});

job("i18n-check", () => {
    runOrThrow("bun", ["run", "--cwd", "apps/web", "i18n:check"]);
});

job("test-web", () => {
    runOrThrow("bun", ["run", "--cwd", "apps/web", "test"]);
});

job("build", () => {
    runOrThrow("bun", ["run", "build"]);
});

// ── DB-dependent checks ──────────────────────────────────────────────────────

job("test", () => {
    if (!dbAvailable) return SKIP;
    runOrThrow("bun", ["run", "test"]);
});

job("migration-drift", () => {
    if (!dbAvailable) return SKIP;
    runOrThrow("bun", ["run", "--cwd", "apps/api", "db:generate"]);
    const status = run("git", ["status", "--porcelain", "apps/api/drizzle"], {
        capture: true,
    });
    if (status.stdout.trim()) {
        throw new Error(
            "Schema drifted from committed migrations.\nRun `bun run --cwd apps/api db:generate` and commit the result."
        );
    }
});

// ── E2E (opt-in) ─────────────────────────────────────────────────────────────

job("e2e", () => {
    if (!withE2e) return SKIP;
    if (!dbAvailable) return SKIP;
    runOrThrow("bun", ["run", "--cwd", "e2e", "test"]);
});

// ── Summary ───────────────────────────────────────────────────────────────────

const sep = "═".repeat(60);
console.log(`\n${sep}`);
console.log("Pipeline summary");
console.log(sep);

const icons = { [PASS]: "✓", [FAIL]: "✗", [SKIP]: "⏭" };
for (const { name, status, duration } of results) {
    console.log(`${icons[status]}  ${name.padEnd(20)} ${status}  ${duration}s`);
}

const failed = results.filter((r) => r.status === FAIL);
const skipped = results.filter((r) => r.status === SKIP);
const passed = results.filter((r) => r.status === PASS);

console.log(
    `\n${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped`
);

if (failed.length > 0) {
    process.exit(1);
}
