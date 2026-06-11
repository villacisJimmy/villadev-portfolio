import { getTranslations } from "next-intl/server";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { StatCounter } from "./StatCounter";
import { Terminal } from "./Terminal";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./Hero.module.css";

export async function Hero() {
  const t = await getTranslations("hero");
  return (
    <section className={styles["hero"]} data-screen-label="Hero">
      <div className={`wrap ${styles["heroGrid"]}`}>
        <div className={styles["heroCopy"]}>
          <RevealOnScroll>
            <AvailabilityBadge />
          </RevealOnScroll>
          <RevealOnScroll as="h1" delay={1} className={styles["heroH1"] ?? ""}>
            <span>{t("h1a")}</span> <span className="gradient-text">{t("h1b")}</span>
          </RevealOnScroll>
          <RevealOnScroll delay={2}>
            <p className={styles["lead"]}>
              {t.rich("lead", { strong: (c) => <strong>{c}</strong> })}
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={3}>
            <div className={styles["heroCta"]}>
              <a href="/#services" className="btn btn-primary">
                {t("cta1")}
              </a>
              <a href="/#contact" className="btn btn-ghost">
                {t("cta2")} ↗
              </a>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={4}>
            <div className={styles["heroStats"]}>
              <div className={styles["stat"]}>
                <StatCounter target={8} suffix="+" />
                <div className={styles["label"]}>{t("stat1.l")}</div>
              </div>
              <div className={styles["stat"]}>
                <StatCounter target={12} suffix="+" />
                <div className={styles["label"]}>{t("stat2.l")}</div>
              </div>
              <div className={styles["stat"]}>
                <div className="num">CCNA</div>
                <div className={styles["label"]}>{t("stat3.l")}</div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
        <RevealOnScroll delay={2} className={styles["heroVisual"] ?? ""}>
          <div className={styles["terminal"]}>
            <div className={styles["termBar"]}>
              <span className={`${styles["tdot"]} ${styles["r"]}`} />
              <span className={`${styles["tdot"]} ${styles["y"]}`} />
              <span className={`${styles["tdot"]} ${styles["g"]}`} />
              <span className={styles["title"]}>villadev@sec — zsh</span>
            </div>
            <Terminal />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
