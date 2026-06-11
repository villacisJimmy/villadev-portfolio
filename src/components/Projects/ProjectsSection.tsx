import { getTranslations } from "next-intl/server";
import { projects } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Link } from "@/lib/i18n/routing";
import styles from "./Projects.module.css";

export async function ProjectsSection() {
  const t = await getTranslations("projects");
  const featured = projects.filter((p) => p.featured);
  return (
    <section className="section" id="projects">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <div className={styles["projGrid"] ?? ""}>
          {featured.map((p, i) => (
            <RevealOnScroll key={p.id} delay={(i % 3) as 0 | 1 | 2}>
              <ProjectCard project={p} />
            </RevealOnScroll>
          ))}
        </div>
        <RevealOnScroll className={styles["projViewall"] ?? ""}>
          <Link href={"/proyectos" as never} className="btn btn-ghost">
            {t("viewall")} ↗
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
