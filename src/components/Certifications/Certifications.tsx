import { getTranslations } from "next-intl/server";
import { certifications } from "@/content/certifications";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./Certifications.module.css";

export async function Certifications() {
  const t = await getTranslations("certs");
  return (
    <section className="section" id="certs">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <RevealOnScroll className={styles["certGrid"] ?? ""}>
          {certifications.map((c) => (
            <div key={c.id} className={styles["cert"]}>
              <span className={`${styles["yr"]} ${c.ongoing ? styles["live"] : ""}`.trim()}>
                {c.year}
              </span>
              <div className={styles["info"]}>
                <div className={styles["name"]}>{c.name}</div>
                <div className={styles["iss"]}>{c.issuer}</div>
              </div>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
