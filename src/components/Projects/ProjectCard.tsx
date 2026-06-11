import { getTranslations } from "next-intl/server";
import type { Project } from "@/content/types";
import { Chip } from "@/components/ui/Chip";
import styles from "./Projects.module.css";

export async function ProjectCard({ project }: { project: Project }) {
  const t = await getTranslations("projects");
  const live = project.status === "live";
  const Wrapper = (project.url ? "a" : "div") as "a" | "div";
  const linkProps: Record<string, string> = project.url
    ? { href: project.url, target: "_blank", rel: "noopener noreferrer" }
    : {};
  const className = `${styles["proj"] ?? ""} ${live ? (styles["live"] ?? "") : ""}`.trim();
  return (
    <Wrapper className={className} data-cat={project.category} {...linkProps}>
      <div className={styles["thumb"] ?? ""}>
        <div className={styles["dots"] ?? ""} />
        <div className={styles["glyph"] ?? ""}>{project.glyph}</div>
      </div>
      <div className={styles["body"] ?? ""}>
        <span className={styles["status"] ?? ""}>
          <span aria-hidden="true">●</span> {t(project.statusKey)}
        </span>
        <h3>{t(project.titleKey)}</h3>
        <p>{t(project.descKey)}</p>
        <div className={styles["tags"] ?? ""}>
          {project.tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
        <span className={styles["link"] ?? ""}>
          {t(project.linkKey)} {project.url ? <span className={styles["arrow"] ?? ""}>↗</span> : ""}
        </span>
      </div>
    </Wrapper>
  );
}
