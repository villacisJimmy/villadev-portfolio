import { describe, it, expect } from "vitest";
import { ContactSchema } from "./contact";

describe("ContactSchema", () => {
  const ok = {
    name: "Jimmy",
    email: "a@b.cl",
    subject: "proyecto",
    message: "Hola, me interesa ya mismo, gracias!",
  };

  it("accepts valid input", () => {
    expect(ContactSchema.safeParse(ok).success).toBe(true);
  });
  it("rejects short name", () => {
    expect(ContactSchema.safeParse({ ...ok, name: "a" }).success).toBe(false);
  });
  it("rejects bad email", () => {
    expect(ContactSchema.safeParse({ ...ok, email: "nope" }).success).toBe(false);
  });
  it("rejects unknown subject", () => {
    expect(ContactSchema.safeParse({ ...ok, subject: "spam" }).success).toBe(false);
  });
  it("rejects short message", () => {
    expect(ContactSchema.safeParse({ ...ok, message: "short" }).success).toBe(false);
  });
  it("rejects honeypot with value", () => {
    expect(ContactSchema.safeParse({ ...ok, hp: "im a bot" }).success).toBe(false);
  });
  it("accepts empty honeypot", () => {
    expect(ContactSchema.safeParse({ ...ok, hp: "" }).success).toBe(true);
  });
});
