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
};

export const requestMeta = new WeakMap<Request, RequestMeta>();
