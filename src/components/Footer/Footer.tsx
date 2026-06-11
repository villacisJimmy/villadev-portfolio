import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import styles from "./Footer.module.css";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className={styles["footer"]}>
      <div className="wrap">
        <div className={styles["footerTop"]}>
          <div>
            <Link href="/" className={styles["brand"]}>
              <span className={styles["mark"]}>
                <span>VD</span>
              </span>
              <span>
                VillaDev<small>SEC · DEV · AUTOMATION</small>
              </span>
            </Link>
            <p className={styles["tagline"]}>{t("footer.tagline")}</p>
          </div>
          <div className={styles["footerLinks"]}>
            <div className={styles["footerCol"]}>
              <h4>{t("footer.nav")}</h4>
              <a href="#services">{t("nav.services")}</a>
              <a href="#about">{t("nav.about")}</a>
              <a href="#projects">{t("nav.projects")}</a>
              <a href="#experience">{t("nav.experience")}</a>
            </div>
            <div className={styles["footerCol"]}>
              <h4>{t("footer.connect")}</h4>
              <a href="mailto:villacis.j@icloud.com">Email</a>
              <a
                href="https://www.linkedin.com/in/jimmy-villacis/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
              <a
                href="https://villacisjimmy.github.io/blog/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Blog
              </a>
            </div>
          </div>
        </div>
        <div className={styles["footerBottom"]}>
          <span>
            © {year} VillaDev · {t("footer.rights")}
          </span>
          <span>{t("footer.built")}</span>
        </div>
      </div>
    </footer>
  );
}
