// Every Supabase client in this app (auth checks, PostgREST queries) makes
// its network calls via a `fetch` supabase-js is handed. Without a timeout,
// a single stalled connection — a network blip, a wedged keep-alive socket,
// Supabase/Postgres momentarily slow — hangs the request indefinitely, which
// is what turned "click a career nav link" into "nothing happens for 30+
// seconds, then it suddenly redirects" (observed: an otherwise-cached
// /api/platforms/unified call took 77s on one request during testing).
// Bound every Supabase-originated fetch instead of letting it hang forever.
const DEFAULT_TIMEOUT_MS = 15_000;

export function createTimeoutFetch(timeoutMs: number = DEFAULT_TIMEOUT_MS): typeof fetch {
  return (input, init) => {
    // Respect an explicit signal the caller already set (e.g. a query built
    // with .abortSignal()) — that caller is already managing cancellation.
    if (init?.signal) return fetch(input, init);
    return fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  };
}
