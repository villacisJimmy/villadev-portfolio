export type ProjectStatus = "live" | "soon";
export type ProjectCategory = "web" | "auto" | "sec";

export interface Project {
  id: string;
  slug: string;
  titleKey: string;
  descKey: string;
  linkKey: string;
  statusKey: string;
  status: ProjectStatus;
  category: ProjectCategory;
  url?: string;
  glyph: string;
  tags: readonly string[];
  featured: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: number;
  ongoing: boolean;
}

export interface ExperienceItem {
  id: string;
  roleKey: string;
  coKey: string;
  whenKey: string;
  descKey: string;
  current: boolean;
  chips: readonly string[];
}

export interface Service {
  id: string;
  index: string;
  titleKey: string;
  descKey: string;
  tags: readonly string[];
  icon: "code" | "automation" | "shield" | "spark";
}

export interface SkillCategory {
  id: string;
  labelKey: string;
  descKey: string;
}
