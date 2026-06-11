import { setRequestLocale, getTranslations } from "next-intl/server";
import { projects } from "@/content/projects";
import type { ProjectCategory } from "@/content/types";
import { ProjectCard } from "@/components/Projects/ProjectCard";
import { ProjectsFilter } from "@/components/Projects/ProjectsFilter";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Link } from "@/lib/i18n/routing";
import styles from "@/components/Projects/Projects.module.css";

const VALID: readonly ProjectCategory[] = ["web", "auto", "sec"];

type SP = { cat?: string };

export default async function ProyectosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  const { cat } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("projpage");
  const filterCat: ProjectCategory | "all" =
    cat && (VALID as readonly string[]).includes(cat) ? (cat as ProjectCategory) : "all";
  const filtered =
    filterCat === "all" ? projects : projects.filter((p) => p.category === filterCat);
  return (
    <section className={`section ${styles["pageHead"] ?? ""}`}>
      <div className="wrap">
        <Link href="/" className={styles["back"]}>
          ← {t("back")}
        </Link>
        <div className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </div>
        <ProjectsFilter />
        <div className={`${styles["projGrid"]} ${styles["all"]}`}>
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
