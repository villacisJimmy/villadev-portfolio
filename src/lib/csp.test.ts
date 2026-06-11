import { describe, it, expect } from "vitest";
import { buildCsp, securityHeaders, generateNonce } from "./csp";

describe("CSP helpers", () => {
  it("nonce is 22+ base64 chars", () => {
    const n = generateNonce();
    expect(n.length).toBeGreaterThanOrEqual(22);
  });

  it("CSP includes nonce in script-src and style-src", () => {
    const csp = buildCsp("abc123");
    expect(csp).toMatch(/script-src[^;]*'nonce-abc123'/);
    expect(csp).toMatch(/style-src[^;]*'nonce-abc123'/);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/api\.resend\.com/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-inline");
  });

  it("securityHeaders contains all required entries", () => {
    const h = securityHeaders("abc");
    expect(h["Content-Security-Policy"]).toBeDefined();
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=\d+/);
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Permissions-Policy"]).toContain("camera=()");
  });
});
