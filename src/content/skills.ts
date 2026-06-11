import type { SkillCategory } from "./types";

export const skillCategories: readonly SkillCategory[] = [
  { id: "sk1", labelKey: "sk1", descKey: "sk1d" },
  { id: "sk3", labelKey: "sk3", descKey: "sk3d" },
  { id: "sk6", labelKey: "sk6", descKey: "sk6d" },
  { id: "sk4", labelKey: "sk4", descKey: "sk4d" },
  { id: "sk2", labelKey: "sk2", descKey: "sk2d" },
  { id: "sk5", labelKey: "sk5", descKey: "sk5d" },
] as const;
