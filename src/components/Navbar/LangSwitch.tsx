"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/routing";
import { locales, type Locale } from "@/lib/i18n/config";
import styles from "./Navbar.module.css";

export function LangSwitch() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className={styles["lang"]} role="group" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          className={l === locale ? styles["langActive"] : ""}
          onClick={() => router.replace(pathname, { locale: l })}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
