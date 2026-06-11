import { describe, it, expect } from "vitest";
import { getClientIp } from "./client-ip";

function h(map: Record<string, string>) {
  return { get: (k: string) => map[k.toLowerCase()] ?? null };
}

describe("getClientIp", () => {
  it("prefers CF-Connecting-IP when TRUSTED_PROXY=cloudflare", () => {
    expect(
      getClientIp(h({ "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" }), "cloudflare"),
    ).toBe("1.2.3.4");
  });
  it("uses last hop of X-Forwarded-For when TRUSTED_PROXY=nginx", () => {
    expect(getClientIp(h({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }), "nginx")).toBe(
      "10.0.0.1",
    );
  });
  it("falls back to 'unknown' if header missing", () => {
    expect(getClientIp(h({}), "nginx")).toBe("unknown");
  });
  it("rejects non-IP-like strings", () => {
    expect(getClientIp(h({ "x-forwarded-for": "not-an-ip" }), "nginx")).toBe("unknown");
  });
});
