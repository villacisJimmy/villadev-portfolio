"use server";
import { headers } from "next/headers";
import { ContactSchema } from "@/lib/schemas/contact";
import { sendContactEmail } from "@/lib/email/resend";
import { createRateLimiter } from "@/lib/rate-limit";
import { getClientIp, type ProxyMode } from "@/lib/client-ip";
import { logger } from "@/lib/logger";

let limiter = createRateLimiter({
  max: Number(process.env["CONTACT_RATE_MAX"] ?? 5),
  windowMs: Number(process.env["CONTACT_RATE_WINDOW"] ?? 600) * 1000,
});

export async function __resetRateLimitForTests(): Promise<void> {
  limiter = createRateLimiter({
    max: Number(process.env["CONTACT_RATE_MAX"] ?? 5),
    windowMs: Number(process.env["CONTACT_RATE_WINDOW"] ?? 600) * 1000,
  });
}

export type ContactState =
  | { ok: true }
  | {
      ok: false;
      error: "validation" | "rate_limit" | "internal";
      fields?: Record<string, string[]>;
    };

export async function submitContact(
  _prev: ContactState | undefined,
  formData: FormData,
): Promise<ContactState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    logger.info({ kind: "contact.validation_error" }, "contact validation");
    return {
      ok: false,
      error: "validation",
      fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const ip = getClientIp(await headers(), (process.env["TRUSTED_PROXY"] as ProxyMode) ?? "nginx");
  const r = limiter.check(`contact:${ip}`);
  if (!r.allowed) {
    logger.warn({ ip: "*masked*", retry: r.retryAfterSeconds }, "contact rate-limited");
    return { ok: false, error: "rate_limit" };
  }
  const sent = await sendContactEmail(parsed.data);
  if (!sent.ok) return { ok: false, error: "internal" };
  logger.info({ kind: "contact.sent", len: parsed.data.message.length }, "contact ok");
  return { ok: true };
}
