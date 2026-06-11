"use client";

import type { PointerEvent } from "react";
import { useTranslations } from "next-intl";
import type { Service } from "@/content/types";
import { Chip } from "@/components/ui/Chip";
import { icons } from "./icons";
import styles from "./Services.module.css";

export function ServiceCard({ service }: { service: Service }) {
  const t = useTranslations("services");
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    e.currentTarget.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  };
  const Icon = icons[service.icon];
  return (
    <article className={styles["service"]} onPointerMove={onMove}>
      <span className={styles["idx"]}>{service.index}</span>
      <div className={styles["ico"]}>
        <Icon />
      </div>
      <h3>{t(service.titleKey)}</h3>
      <p>{t(service.descKey)}</p>
      <div className={styles["tags"]}>
        {service.tags.map((tag) => (
          <Chip key={tag}>{tag}</Chip>
        ))}
      </div>
    </article>
  );
}
