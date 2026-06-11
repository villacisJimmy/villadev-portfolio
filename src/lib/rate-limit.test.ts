import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to max requests in window", () => {
    const rl = createRateLimiter({ max: 3, windowMs: 60_000 });
    expect(rl.check("ip1").allowed).toBe(true);
    expect(rl.check("ip1").allowed).toBe(true);
    expect(rl.check("ip1").allowed).toBe(true);
    expect(rl.check("ip1").allowed).toBe(false);
  });

  it("isolates per key", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 60_000 });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
  });

  it("refills after window passes", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 1_000 });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(rl.check("a").allowed).toBe(true);
  });

  it("returns retryAfterSeconds when blocked", () => {
    const rl = createRateLimiter({ max: 1, windowMs: 60_000 });
    rl.check("a");
    const r = rl.check("a");
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });
});
