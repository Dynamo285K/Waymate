import { AsyncLocalStorage } from "node:async_hooks";

// Per-request metadata stash. Populated in the root `.onRequest` hook with a
// fresh requestId and a high-resolution start time, then read back from
// `.onAfterResponse` / `.onError` / module-level `.onError` factories so every
// log line for the same request can carry the same requestId.
//
// A WeakMap keyed by the Request object lets the entry be garbage-collected
// once the request is done — no manual cleanup needed.
export type RequestMeta = {
    requestId: string;
    startedAt: number;
    payloadTooLarge?: boolean;
};

export const requestMeta = new WeakMap<Request, RequestMeta>();

// Same metadata, carried implicitly through the async call chain so any code
// reached from a request handler (services, repositories, OSRM/chat helpers)
// can be correlated without threading `requestId` through every signature. The
// logger reads it via a `mixin` (see logger.ts). Set with `enterWith` in
// `.onRequest`; empty outside a request (e.g. the auto-end worker), so those
// logs simply carry no requestId.
export const requestContext = new AsyncLocalStorage<RequestMeta>();
