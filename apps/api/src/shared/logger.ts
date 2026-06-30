import pino from "pino";
import type { PrettyOptions } from "pino-pretty";
import { env } from "../config/env";
import { requestContext } from "./request-meta";

// Pretty-print is a dev-time convenience; production stays on JSON so log
// aggregators can parse cleanly. pino-pretty is a devDependency, loaded
// in-process via a dev-only require — prod never touches it (no stream → pino
// writes JSON to stdout). In-process (not a worker transport) so messageFormat
// can be a function: it renders the per-request summary line compactly and
// dims the requestId so a request's lines are scannable at a glance.
const prettyOptions: PrettyOptions = {
    colorize: true,
    translateTime: "SYS:HH:MM:ss.l",
    singleLine: true,
    // Fields rendered inline below are dropped from the trailing object so
    // they aren't printed twice.
    ignore: "pid,hostname,requestId,method,path,status,durationMs",
    messageFormat: (log, messageKey, _levelLabel, { colors }) => {
        const id = log.requestId
            ? `${colors.gray(String(log.requestId))}  `
            : "";
        if (log.msg === "request") {
            const status = Number(log.status);
            const paint =
                status >= 500
                    ? colors.red
                    : status >= 400
                      ? colors.yellow
                      : colors.green;
            // requestId only on non-2xx — on success it's noise you never grep.
            const errId = status >= 400 ? id : "";
            return `${errId}${log.method} ${log.path} ${colors.gray("→")} ${paint(String(log.status))} ${log.durationMs}ms`;
        }
        // Service/error logs (osrm_parse_failed, unhandled_error, …) keep the id
        // always — these are exactly the lines you correlate back to a request.
        return `${id}${log[messageKey]}`;
    },
};

const stream =
    env.NODE_ENV === "development"
        ? (await import("pino-pretty")).default(prettyOptions)
        : undefined;

export const logger = pino(
    {
        level: env.LOG_LEVEL,
        // Auto-correlate: any log emitted while handling a request carries its
        // requestId, without each call-site having to pass it. Empty outside a
        // request (workers, startup), so those lines simply omit it.
        mixin() {
            const requestId = requestContext.getStore()?.requestId;
            return requestId ? { requestId } : {};
        },
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
    },
    stream
);

export type Logger = typeof logger;
