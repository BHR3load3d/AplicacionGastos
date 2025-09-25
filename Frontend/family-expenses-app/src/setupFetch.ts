// Global fetch policy: timeout, minimal retries, dedup of identical inflight requests
// This helps avoid long waits when server is down but network is up.

const originalFetch: typeof fetch = window.fetch.bind(window);

const inflight = new Map<string, Promise<Response>>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeKey(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof input === 'string') {
    return `${init?.method || 'GET'} ${input} ${init?.body ? JSON.stringify(init.body) : ''}`;
  }
  const req = input as Request;
  return `${req.method} ${req.url}`;
}

async function fetchWithPolicy(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const key = makeKey(input, init);
  if (inflight.has(key)) return inflight.get(key)!;

  const retries = (init as any).retries ?? 0;
  const timeoutMs = (init as any).timeoutMs ?? 2500;
  const userSignal = init.signal;

  const run = async () => {
    let lastErr: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const ac = new AbortController();
      const onAbort = () => ac.abort();
      // If caller provided a signal, propagate aborts
      if (userSignal) userSignal.addEventListener('abort', onAbort, { once: true });

      const timer = setTimeout(() => {
        ac.abort();
      }, timeoutMs);

      try {
        const res = await originalFetch(input as any, { ...init, signal: ac.signal });
        clearTimeout(timer);
        if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch (err) {
        lastErr = err;
        clearTimeout(timer);
        if (attempt < retries) {
          const backoff = Math.min(2000, 300 * 2 ** attempt) + Math.random() * 150;
          await sleep(backoff);
          continue;
        }
      } finally {
        if (userSignal) userSignal.removeEventListener('abort', onAbort as any);
      }
    }
    throw lastErr;
  };

  const p = run().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Monkey-patch window.fetch
(window as any).fetch = fetchWithPolicy;

export {};