import pino, { type LoggerOptions } from "pino";
import { env } from "../config/env";

// Pretty-print is a dev-time convenience; production stays on JSON so log
// aggregators can parse cleanly. We only require pino-pretty in dev; in prod
// the transport key is omitted so no extra dependency is loaded.
const transport: LoggerOptions["transport"] =
    env.NODE_ENV === "development"
        ? {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "SYS:HH:MM:ss.l",
                  ignore: "pid,hostname",
              },
          }
        : undefined;

export const logger = pino({
    level: env.LOG_LEVEL,
    transport,
    // Defense in depth: even if a caller accidentally logs the full request,
    // Authorization / Cookie / Set-Cookie values never reach stdout. Pino's
    // redact runs before serialization, so the path is safe.
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "headers.authorization",
            "headers.cookie",
            'res.headers["set-cookie"]',
            "*.password",
            "*.token",
        ],
        remove: true,
    },
});

export type Logger = typeof logger;
