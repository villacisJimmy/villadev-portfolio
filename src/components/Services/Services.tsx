import { getTranslations } from "next-intl/server";
import { services } from "@/content/services";
import { ServiceCard } from "./ServiceCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Eyebrow } from "@/components/ui/Eyebrow";
import styles from "./Services.module.css";

export async function Services() {
  const t = await getTranslations("services");
  return (
    <section className="section" id="services">
      <div className="wrap">
        <RevealOnScroll className="section-head">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
        </RevealOnScroll>
        <div className={styles["servicesGrid"]}>
          {services.map((s, i) => (
            <RevealOnScroll key={s.id} delay={(i % 2) as 0 | 1}>
              <ServiceCard service={s} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
