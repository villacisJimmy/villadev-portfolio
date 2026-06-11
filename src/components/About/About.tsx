import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import styles from "./About.module.css";

export async function About() {
  const t = await getTranslations("about");
  const facts = ["f1", "f2", "f3", "f4"] as const;
  return (
    <section className="section" id="about">
      <div className={`wrap ${styles["aboutGrid"]}`}>
        <RevealOnScroll className={styles["aboutPhoto"] ?? ""}>
          <div className={styles["frame"]}>
            <Image
              src="/profile.jpeg"
              alt="Jimmy Villacis"
              width={460}
              height={460}
              className={styles["profileImg"] ?? ""}
              priority
            />
            <div className={styles["scan"]} />
            <span className={`${styles["corner"]} ${styles["c1"]}`} />
            <span className={`${styles["corner"]} ${styles["c2"]}`} />
            <span className={`${styles["corner"]} ${styles["c3"]}`} />
            <span className={`${styles["corner"]} ${styles["c4"]}`} />
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={1} className={styles["aboutBody"] ?? ""}>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t.rich("p1", { strong: (c) => <strong>{c}</strong> })}</p>
          <p>{t.rich("p2", { strong: (c) => <strong>{c}</strong> })}</p>
          <div className={styles["aboutFacts"]}>
            {facts.map((f) => (
              <div key={f} className={styles["fact"]}>
                <div className={styles["k"]}>{t(`facts.${f}k`)}</div>
                <div className={styles["v"]}>{t(`facts.${f}v`)}</div>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
