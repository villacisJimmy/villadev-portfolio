type Bucket = { count: number; resetAt: number };
type Opts = { max: number; windowMs: number };
type Result = { allowed: boolean; remaining: number; retryAfterSeconds: number };

export function createRateLimiter(opts: Opts) {
  const buckets = new Map<string, Bucket>();
  return {
    check(key: string): Result {
      const now = Date.now();
      const b = buckets.get(key);
      if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
        return { allowed: true, remaining: opts.max - 1, retryAfterSeconds: 0 };
      }
      if (b.count >= opts.max) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000),
        };
      }
      b.count += 1;
      return { allowed: true, remaining: opts.max - b.count, retryAfterSeconds: 0 };
    },
  };
}
