import type { Certification } from "./types";

export const certifications: readonly Certification[] = [
  {
    id: "fsjs",
    name: "Bootcamp Full Stack JavaScript",
    issuer: "en curso",
    year: 2025,
    ongoing: true,
  },
  { id: "linux", name: "Linux para DevOps", issuer: "DevOps", year: 2025, ongoing: false },
  { id: "secp", name: "CompTIA Security+", issuer: "preparando cert.", year: 2025, ongoing: true },
  {
    id: "iax",
    name: "Transformación Digital con IA",
    issuer: "IA & Automatización",
    year: 2025,
    ongoing: false,
  },
  {
    id: "cnios",
    name: "Cisco CNIOS",
    issuer: "Network Operating Systems",
    year: 2025,
    ongoing: false,
  },
  { id: "ccna", name: "Cisco CCNA R&S", issuer: "Routing & Switching", year: 2024, ongoing: false },
  { id: "nse3", name: "Fortinet NSE 3", issuer: "Network Security", year: 2023, ongoing: false },
  { id: "qualys", name: "Qualys VMDR", issuer: "Vulnerability Mgmt", year: 2022, ongoing: false },
  {
    id: "aws",
    name: "AWS Cloud Technical Essentials",
    issuer: "Cloud",
    year: 2021,
    ongoing: false,
  },
  {
    id: "dragon",
    name: "Diplomado Seguridad Ofensiva",
    issuer: "DragonJAR · Pentesting",
    year: 2021,
    ongoing: false,
  },
  {
    id: "duoc",
    name: "Diplomado Seguridad de la Información",
    issuer: "Duoc UC · GPA 6.7",
    year: 2020,
    ongoing: false,
  },
  {
    id: "td",
    name: "Bootcamps Full Stack (Python/Java)",
    issuer: "Talento Digital",
    year: 2021,
    ongoing: false,
  },
] as const;
