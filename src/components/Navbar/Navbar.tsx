"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { LangSwitch } from "./LangSwitch";
import { MobileMenu } from "./MobileMenu";
import styles from "./Navbar.module.css";

export function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`${styles["nav"]} ${scrolled ? styles["scrolled"] : ""}`}>
      <div className={`wrap ${styles["navInner"]}`}>
        <Link href="/" className={styles["brand"]}>
          <span className={styles["mark"]}>
            <span>VD</span>
          </span>
          <span>VillaDev</span>
        </Link>
        <nav>
          <ul className={styles["navLinks"]}>
            <li>
              <a href="#services">{t("services")}</a>
            </li>
            <li>
              <a href="#about">{t("about")}</a>
            </li>
            <li>
              <a href="#projects">{t("projects")}</a>
            </li>
            <li>
              <a href="#experience">{t("experience")}</a>
            </li>
            <li>
              <a href="#skills">{t("skills")}</a>
            </li>
          </ul>
        </nav>
        <div className={styles["navRight"]}>
          <LangSwitch />
          <a href="#contact" className="btn btn-primary">
            {t("cta")}
          </a>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
