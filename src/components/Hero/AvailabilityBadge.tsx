import { z } from "zod";
import { getTranslations } from "next-intl/server";
import styles from "./Hero.module.css";

const Env = z.object({ AVAILABLE: z.enum(["true", "false"]).default("true") });

export async function AvailabilityBadge() {
  const t = await getTranslations("hero");
  const { AVAILABLE } = Env.parse({ AVAILABLE: process.env["AVAILABLE"] });
  if (AVAILABLE !== "true") return null;
  return (
    <span className={styles["badgeLive"]}>
      <span className={styles["dot"]} />
      <span>{t("badge")}</span>
    </span>
  );
}
