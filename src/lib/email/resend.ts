import { Resend } from "resend";
import { logger } from "@/lib/logger";
import type { ContactInput } from "@/lib/schemas/contact";

let client: Resend | null = null;
function get(): Resend {
  if (client) return client;
  const key = process.env["RESEND_API_KEY"];
  if (!key) throw new Error("RESEND_API_KEY missing");
  client = new Resend(key);
  return client;
}

export function __resetForTests(): void {
  client = null;
}

const SUBJECT_LABEL: Record<ContactInput["subject"], string> = {
  proyecto: "Desarrollo de aplicación web",
  consultoria: "Automatización con n8n",
  colaboracion: "Seguridad / auditoría",
  otro: "Otro",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactEmail(input: ContactInput): Promise<{ ok: boolean }> {
  const to = process.env["CONTACT_TO_EMAIL"];
  const from = process.env["CONTACT_FROM_EMAIL"];
  const fromName = process.env["CONTACT_FROM_NAME"] ?? "VillaDev";
  if (!to || !from) {
    logger.error("contact email env missing");
    return { ok: false };
  }
  const subj = `[Portafolio] ${SUBJECT_LABEL[input.subject]} — ${input.name.trim()}`;
  const html = `<p><strong>De:</strong> ${escapeHtml(input.name.trim())} &lt;${escapeHtml(input.email)}&gt;</p>
<p><strong>Asunto:</strong> ${escapeHtml(SUBJECT_LABEL[input.subject])}</p>
<pre style="font-family:ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(input.message.trim())}</pre>`;
  const { error } = await get().emails.send({
    from: `${fromName} <${from}>`,
    to: [to],
    replyTo: input.email,
    subject: subj,
    html,
  });
  if (error) {
    logger.error({ err: error.message }, "resend send failed");
    return { ok: false };
  }
  return { ok: true };
}
