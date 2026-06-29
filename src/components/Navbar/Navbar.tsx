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
              <Link href={{ pathname: "/", hash: "services" }}>{t("services")}</Link>
            </li>
            <li>
              <Link href={{ pathname: "/", hash: "about" }}>{t("about")}</Link>
            </li>
            <li>
              <Link href={{ pathname: "/", hash: "projects" }}>{t("projects")}</Link>
            </li>
            <li>
              <Link href={{ pathname: "/", hash: "experience" }}>{t("experience")}</Link>
            </li>
            <li>
              <Link href={{ pathname: "/", hash: "skills" }}>{t("skills")}</Link>
            </li>
          </ul>
        </nav>
        <div className={styles["navRight"]}>
          <LangSwitch />
          <Link href={{ pathname: "/", hash: "contact" }} className="btn btn-primary">
            {t("cta")}
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
