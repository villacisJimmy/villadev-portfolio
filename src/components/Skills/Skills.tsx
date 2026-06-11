import { getTranslations } from "next-intl/server";
import { skillCategories } from "@/content/skills";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./Skills.module.css";

export async function Skills() {
  const t = await getTranslations("skills");
  return (
    <section className="section" id="skills">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <div className={styles["skillsGrid"]}>
          {skillCategories.map((s, i) => (
            <RevealOnScroll
              key={s.id}
              delay={(i % 3) as 0 | 1 | 2}
              className={styles["skillCat"] ?? ""}
            >
              <div className={styles["ch"]}>
                <span>{t(s.labelKey)}</span>
                <span className={styles["ln"]} />
              </div>
              <p className={styles["skillDesc"]}>{t(s.descKey)}</p>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
