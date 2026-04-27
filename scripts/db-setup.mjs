import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(repoRoot);

const log = (message) => console.log(`==> ${message}`);
const err = (message) => console.error(`xx  ${message}`);

function run(command, args, options = {}) {
    return spawnSync(command, args, {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: options.capture ? "pipe" : "inherit",
        windowsHide: true,
    });
}

function requireOk(result, message) {
    if (result.error) {
        err(`${message}: ${result.error.message}`);
        process.exit(1);
    }
    if (result.status !== 0) {
        err(message);
        process.exit(result.status ?? 1);
    }
}

requireOk(
    run("docker", ["--version"], { capture: true }),
    "Docker is not installed. Install Docker Desktop and re-run this script."
);

requireOk(
    run("docker", ["compose", "version"], { capture: true }),
    "Docker Compose v2 is not available (`docker compose`). Update Docker Desktop or install the compose plugin."
);

const dockerInfo = run("docker", ["info"], { capture: true });
if (dockerInfo.status !== 0) {
    const output =
        `${dockerInfo.stdout ?? ""}${dockerInfo.stderr ?? ""}`.trim();

    if (/permission denied/i.test(output)) {
        err("Docker daemon is running but your user cannot access it.");
        process.exit(1);
    }

    if (/cannot connect|is the docker daemon running/i.test(output)) {
        err(
            "Docker daemon is not running. Start Docker Desktop and re-run this script."
        );
        process.exit(1);
    }

    err(`Docker is not usable: ${output}`);
    process.exit(1);
}

const apiEnv = "apps/api/.env";
const apiEnvExample = "apps/api/.env.example";

if (!existsSync(apiEnv)) {
    log(`Creating ${apiEnv} from ${apiEnvExample}`);
    copyFileSync(apiEnvExample, apiEnv);
} else {
    log(`${apiEnv} already exists - leaving it untouched`);
}

log("Starting Postgres via docker compose");
requireOk(
    run("docker", ["compose", "up", "-d"]),
    "Failed to start Postgres via docker compose."
);

log("Waiting for Postgres to accept connections");
const maxAttempts = 30;
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const ready = run(
        "docker",
        [
            "compose",
            "exec",
            "-T",
            "db",
            "pg_isready",
            "-U",
            "postgres",
            "-d",
            "spolujazda_db",
        ],
        { capture: true }
    );

    if (ready.status === 0) {
        log(
            "Database is ready at postgres://postgres:postgres@localhost:5432/spolujazda_db"
        );
        log(
            "Setup complete. Next: `bun install` (if you haven't yet) and `bun run dev`."
        );
        process.exit(0);
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
}

err(
    `Postgres did not become ready within ${maxAttempts} seconds. Check \`docker compose logs db\`.`
);
process.exit(1);
