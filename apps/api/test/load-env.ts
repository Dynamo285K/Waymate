import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

// dotenv default: does NOT override existing process.env. So:
//   shell env  >  .env.test  >  .env (loaded later by config/env.ts)
config({ path: path.resolve(dir, "../.env.test") });
