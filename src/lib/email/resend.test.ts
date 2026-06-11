import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function (this: { emails: { send: typeof sendMock } } | void) {
    return { emails: { send: sendMock } };
  }),
}));

import { sendContactEmail, __resetForTests } from "./resend";

describe("sendContactEmail", () => {
  beforeEach(() => {
    __resetForTests();
    sendMock.mockReset();
    process.env["RESEND_API_KEY"] = "re_test";
    process.env["CONTACT_TO_EMAIL"] = "to@example.com";
    process.env["CONTACT_FROM_EMAIL"] = "contacto@example.com";
    process.env["CONTACT_FROM_NAME"] = "VillaDev";
  });

  it("calls Resend with sanitized fields", async () => {
    sendMock.mockResolvedValue({ data: { id: "x" }, error: null });
    const r = await sendContactEmail({
      name: "  Jimmy  ",
      email: "a@b.cl",
      subject: "proyecto",
      message: "Hola, necesito una app web con login.",
    });
    expect(r.ok).toBe(true);
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0]![0];
    expect(call.to).toEqual(["to@example.com"]);
    expect(call.replyTo).toBe("a@b.cl");
    expect(call.subject).toMatch(/\[Portafolio\]/);
  });

  it("returns ok=false on provider error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: "x", message: "boom" } });
    const r = await sendContactEmail({
      name: "Jimmy",
      email: "a@b.cl",
      subject: "otro",
      message: "x".repeat(30),
    });
    expect(r.ok).toBe(false);
  });
});
