"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/lib/i18n/routing";
import { useSearchParams } from "next/navigation";
import styles from "./Projects.module.css";

const CATS = ["all", "web", "auto", "sec"] as const;
type Cat = (typeof CATS)[number];

export function ProjectsFilter() {
  const t = useTranslations("filter");
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const active = (sp.get("cat") ?? "all") as Cat;
  const setCat = (c: Cat) => {
    const next = c === "all" ? "" : `?cat=${c}`;
    router.replace(`${pathname}${next}` as never);
  };
  return (
    <div className={styles["projFilter"]}>
      {CATS.map((c) => (
        <button
          key={c}
          type="button"
          className={c === active ? styles["active"] : ""}
          onClick={() => setCat(c)}
        >
          {t(c)}
        </button>
      ))}
    </div>
  );
}
