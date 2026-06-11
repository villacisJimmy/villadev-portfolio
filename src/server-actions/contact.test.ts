import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/email/resend", () => ({ sendContactEmail: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: (k: string) => (k.toLowerCase() === "x-forwarded-for" ? "1.2.3.4" : null),
  })),
}));

import { sendContactEmail } from "@/lib/email/resend";
import { __resetRateLimitForTests, submitContact } from "./contact";

const fd = (data: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.append(k, v);
  return f;
};

const valid = {
  name: "Jimmy",
  email: "a@b.cl",
  subject: "proyecto",
  message: "Hola, esto es un mensaje suficientemente largo.",
};

describe("submitContact", () => {
  beforeEach(async () => {
    process.env["TRUSTED_PROXY"] = "nginx";
    process.env["CONTACT_RATE_MAX"] = "3";
    process.env["CONTACT_RATE_WINDOW"] = "600";
    await __resetRateLimitForTests();
    (sendContactEmail as ReturnType<typeof vi.fn>).mockReset();
    (sendContactEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
  });

  it("rejects invalid input", async () => {
    const r = await submitContact(undefined, fd({ ...valid, email: "bad" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("validation");
  });
  it("rejects honeypot", async () => {
    const r = await submitContact(undefined, fd({ ...valid, hp: "bot" }));
    expect(r.ok).toBe(false);
  });
  it("sends email on success", async () => {
    const r = await submitContact(undefined, fd(valid));
    expect(r.ok).toBe(true);
    expect(sendContactEmail).toHaveBeenCalledOnce();
  });
  it("rate-limits the 4th attempt", async () => {
    for (let i = 0; i < 3; i++) await submitContact(undefined, fd(valid));
    const r = await submitContact(undefined, fd(valid));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("rate_limit");
  });
  it("returns internal error if provider fails", async () => {
    (sendContactEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    const r = await submitContact(undefined, fd(valid));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("internal");
  });
});
