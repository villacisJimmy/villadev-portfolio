import pino from "pino";

const SENSITIVE = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
  "api_key",
  "apikey",
  "resend_api_key",
  "ghcr_token",
  "vps_ssh_key",
]);

export function redactValue(key: string, value: unknown): unknown {
  return SENSITIVE.has(key.toLowerCase()) ? "[REDACTED]" : value;
}

export const logger = pino({
  level: process.env["LOG_LEVEL"] ?? (process.env["NODE_ENV"] === "production" ? "info" : "debug"),
  redact: {
    paths: Array.from(SENSITIVE),
    censor: "[REDACTED]",
  },
  base: { service: "villadev-portfolio" },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
