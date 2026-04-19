/**
 * Simple in-memory rate limiter.
 * 1 search per IP per 24 hours for the live demo.
 * Resets on server restart (fine for demo purposes).
 */

const store = new Map<string, number>();

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const lastRequest = store.get(ip);

  if (lastRequest && now - lastRequest < WINDOW_MS) {
    return {
      allowed: false,
      retryAfterMs: WINDOW_MS - (now - lastRequest),
    };
  }

  store.set(ip, now);
  return { allowed: true, retryAfterMs: 0 };
}
