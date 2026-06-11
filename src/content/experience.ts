import type { ExperienceItem } from "./types";

export const experience: readonly ExperienceItem[] = [
  {
    id: "inev",
    current: true,
    roleKey: "items.exp1.role",
    coKey: "items.exp1.co",
    whenKey: "items.exp1.when",
    descKey: "items.exp1.p",
    chips: ["VLAN", "UniFi UDM", "HP iLO", "Trello", "Gantt"],
  },
  {
    id: "aus",
    current: false,
    roleKey: "items.exp2.role",
    coKey: "items.exp2.co",
    whenKey: "items.exp2.when",
    descKey: "items.exp2.p",
    chips: ["English B2", "Adaptabilidad"],
  },
  {
    id: "cgs",
    current: false,
    roleKey: "items.exp3.role",
    coKey: "items.exp3.co",
    whenKey: "items.exp3.when",
    descKey: "items.exp3.p",
    chips: ["Clientes B2B", "Integraciones"],
  },
  {
    id: "entel",
    current: false,
    roleKey: "items.exp4.role",
    coKey: "items.exp4.co",
    whenKey: "items.exp4.when",
    descKey: "items.exp4.p",
    chips: ["Windows", "Linux", "Active Directory"],
  },
  {
    id: "cam",
    current: false,
    roleKey: "items.exp5.role",
    coKey: "items.exp5.co",
    whenKey: "items.exp5.when",
    descKey: "items.exp5.p",
    chips: ["FTTH", "Fibra óptica", "CTO/NAP"],
  },
] as const;
