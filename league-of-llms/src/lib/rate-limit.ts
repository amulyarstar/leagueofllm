/**
 * Lightweight rate limiter.
 *
 * In production, set UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN to back this
 * with real distributed storage. Without them, falls back to an in-memory window,
 * which is fine for a single-instance deploy or local dev but resets on cold start
 * and does not share state across serverless instances.
 */

type Bucket = { count: number; windowStart: number };

const WINDOW_MS = 60_000; // 1 minute
const LIMITS: Record<string, number> = {
  "/api/battle": 8, // creating a battle triggers N model calls, so keep this tight
  "/api/vote": 30,
  default: 60,
};

const memoryStore = new Map<string, Bucket>();

function limitFor(pathname: string) {
  const match = Object.keys(LIMITS).find((key) => key !== "default" && pathname.startsWith(key));
  return LIMITS[match ?? "default"];
}

export async function checkRateLimit(
  identifier: string,
  pathname: string
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const limit = limitFor(pathname);
  const key = `${identifier}:${pathname.split("/").slice(0, 3).join("/")}`;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    // Sliding-window counter via Upstash REST API (no SDK dependency needed).
    const res = await fetch(`${upstashUrl}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${upstashToken}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, WINDOW_MS.toString(), "NX"],
      ]),
      cache: "no-store",
    });
    const [incrResult] = (await res.json()) as { result: number }[];
    const count = incrResult?.result ?? 1;
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetMs: WINDOW_MS };
  }

  const now = Date.now();
  const bucket = memoryStore.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    memoryStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetMs: WINDOW_MS };
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return { allowed, remaining: Math.max(0, limit - bucket.count), resetMs: WINDOW_MS - (now - bucket.windowStart) };
}
