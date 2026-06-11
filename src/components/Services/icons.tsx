import type { JSX } from "react";

type IconFn = () => JSX.Element;

const code: IconFn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const automation: IconFn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
    <circle cx="5" cy="6" r="2.4" />
    <circle cx="19" cy="6" r="2.4" />
    <circle cx="12" cy="18" r="2.4" />
    <path d="M5 8.4v3a2 2 0 0 0 2 2h3.2M19 8.4v3a2 2 0 0 1-2 2h-3.2M12 13.4v2.2" />
  </svg>
);

const shield: IconFn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
    <path d="M9.5 12l1.8 1.8L15 10" />
  </svg>
);

const spark: IconFn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
    <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z" />
  </svg>
);

export const icons: Record<"code" | "automation" | "shield" | "spark", IconFn> = {
  code,
  automation,
  shield,
  spark,
};
