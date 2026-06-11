import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { ContactForm } from "./ContactForm";
import styles from "./Contact.module.css";

export async function Contact() {
  const t = await getTranslations("contact");
  return (
    <section className="section" id="contact">
      <div className={`wrap ${styles["contactGrid"]}`}>
        <RevealOnScroll className={styles["contactBody"] ?? ""}>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2>{t("h2")}</h2>
          <p>{t("p")}</p>
          <div className={styles["contactList"]}>
            <a href="mailto:villacis.j@icloud.com">
              <span className={styles["cl"]}>Correo</span>
              <span className={styles["cv"]}>villacis.j@icloud.com</span>
            </a>
            <a
              href="https://www.linkedin.com/in/jimmy-villacis/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles["cl"]}>LinkedIn</span>
              <span className={styles["cv"]}>in/jimmy-villacis</span>
            </a>
            <a
              href="https://villacisjimmy.github.io/blog/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles["cl"]}>Blog</span>
              <span className={styles["cv"]}>villacisjimmy.github.io</span>
            </a>
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={1}>
          <ContactForm />
        </RevealOnScroll>
      </div>
    </section>
  );
}
