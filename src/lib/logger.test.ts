import { describe, it, expect } from "vitest";
import { logger, redactValue } from "./logger";

describe("logger redaction", () => {
  it("redacts known sensitive keys", () => {
    expect(redactValue("RESEND_API_KEY", "re_secret123")).toBe("[REDACTED]");
    expect(redactValue("password", "p")).toBe("[REDACTED]");
    expect(redactValue("authorization", "Bearer x")).toBe("[REDACTED]");
  });

  it("leaves harmless keys untouched", () => {
    expect(redactValue("name", "Jimmy")).toBe("Jimmy");
  });

  it("exposes a logger instance", () => {
    expect(typeof logger.info).toBe("function");
  });

  it("does not throw when logging an object with secrets", () => {
    expect(() => logger.info({ password: "x", name: "y" }, "test")).not.toThrow();
  });
});
