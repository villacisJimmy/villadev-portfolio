import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "default";
type Common = { variant?: Variant; children: ReactNode };

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  const { variant = "default", className = "", children, ...rest } = props;
  return (
    <button className={`${styles["btn"]} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & Common) {
  const { variant = "default", className = "", children, ...rest } = props;
  return (
    <a className={`${styles["btn"]} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </a>
  );
}
