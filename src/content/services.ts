import type { Service } from "./types";

export const services: readonly Service[] = [
  {
    id: "web",
    index: "01",
    titleKey: "items.svc1.t",
    descKey: "items.svc1.p",
    tags: ["JavaScript", "Python", "Django", "SQL"],
    icon: "code",
  },
  {
    id: "auto",
    index: "02",
    titleKey: "items.svc2.t",
    descKey: "items.svc2.p",
    tags: ["n8n", "APIs", "Webhooks", "Docker"],
    icon: "automation",
  },
  {
    id: "sec",
    index: "03",
    titleKey: "items.svc3.t",
    descKey: "items.svc3.p",
    tags: ["Pentesting", "Hardening", "OWASP"],
    icon: "shield",
  },
  {
    id: "ai",
    index: "04",
    titleKey: "items.svc4.t",
    descKey: "items.svc4.p",
    tags: ["Claude", "ChatGPT", "Gemini"],
    icon: "spark",
  },
] as const;
