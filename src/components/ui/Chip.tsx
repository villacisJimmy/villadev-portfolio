import type { ReactNode } from "react";
import styles from "./Chip.module.css";

type Tone = "blue" | "neutral";

export function Chip({ children, tone = "blue" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`${styles["chip"]} ${styles[tone]}`}>{children}</span>;
}
