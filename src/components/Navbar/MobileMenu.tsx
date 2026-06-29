"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import styles from "./Navbar.module.css";

export function MobileMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const items: ReadonlyArray<readonly [string, string]> = [
    ["services", "01"],
    ["about", "02"],
    ["projects", "03"],
    ["experience", "04"],
    ["skills", "05"],
    ["contact", "06"],
  ];
  return (
    <>
      <button className={styles["navToggle"]} aria-label="Menu" onClick={() => setOpen((v) => !v)}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <line x1="3" y1="7" x2="21" y2="7" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </svg>
      </button>
      <div className={`${styles["mobileMenu"]} ${open ? styles["open"] : ""}`}>
        {items.map(([k, n]) => (
          <Link key={k} href={{ pathname: "/", hash: k }} onClick={close}>
            <span className={styles["n"]}>{n}</span>
            <span>{t(k)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
