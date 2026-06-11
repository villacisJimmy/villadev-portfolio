import { getTranslations } from "next-intl/server";
import { experience } from "@/content/experience";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./Experience.module.css";

export async function Experience() {
  const t = await getTranslations("experience");
  return (
    <section className="section" id="experience">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <div className={styles["timeline"] ?? ""}>
          {experience.map((item) => (
            <RevealOnScroll
              key={item.id}
              className={`${styles["tlItem"] ?? ""} ${item.current ? (styles["now"] ?? "") : ""}`.trim()}
            >
              <span className={styles["node"] ?? ""} />
              <div className={styles["tlHead"] ?? ""}>
                <h3>{t(item.roleKey)}</h3>
                <span className={styles["co"] ?? ""}>— {t(item.coKey)}</span>
                <span className={styles["tlWhen"] ?? ""}>{t(item.whenKey)}</span>
              </div>
              <p>{t(item.descKey)}</p>
              <div className={styles["chips"] ?? ""}>
                {item.chips.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
