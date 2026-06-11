"use client";
import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

type LineSpec = {
  html: string;
  cmd: string;
  delay: number;
  instant?: boolean;
};

const LINES: readonly LineSpec[] = [
  {
    html: '<span class="prompt">villadev@sec</span>:<span class="path">~/proyecto</span>$ ',
    cmd: "init --secure-by-design",
    delay: 38,
  },
  {
    html: '<span class="out">✓ entorno listo · dependencias auditadas</span>',
    cmd: "",
    delay: 12,
    instant: true,
  },
  {
    html: '<span class="prompt">villadev@sec</span>:<span class="path">~/proyecto</span>$ ',
    cmd: "deploy --fast",
    delay: 38,
  },
  {
    html: '<span class="out">→ build <span class="key">1.8s</span> · tests <span class="ok">passing</span></span>',
    cmd: "",
    delay: 12,
    instant: true,
  },
  {
    html: '<span class="out">→ <span class="key">n8n</span> workflows conectados</span>',
    cmd: "",
    delay: 12,
    instant: true,
  },
  {
    html: '<span class="ok">✓ en producción · seguro &amp; veloz</span>',
    cmd: "",
    delay: 12,
    instant: true,
  },
] as const;

export function Terminal() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const term = ref.current;
    if (!term) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const termLineClass = styles["termLine"] ?? "";
    if (reduce) {
      // Static fallback for reduced-motion. Content is fully author-controlled (no user input).
      term.innerHTML =
        `<div class="${termLineClass}"><span class="prompt">villadev@sec</span>:<span class="path">~/proyecto</span>$ <span class="cmd">deploy --fast --secure</span></div>` +
        `<div class="${termLineClass}"><span class="ok">✓ en producción · seguro &amp; veloz</span></div>`;
      return;
    }
    let li = 0;
    let cancelled = false;
    const make = () => {
      const el = document.createElement("div");
      el.className = termLineClass;
      term.appendChild(el);
      return el;
    };
    const typeLine = () => {
      if (cancelled) return;
      if (li >= LINES.length) {
        const cur = document.createElement("span");
        cur.className = styles["cursor"] ?? "";
        make().appendChild(cur);
        return;
      }
      const spec = LINES[li];
      if (!spec) return;
      const el = make();
      // Author-controlled literal HTML from the LINES table above (no user input).
      el.innerHTML = spec.html;
      if (spec.instant || !spec.cmd) {
        li++;
        setTimeout(typeLine, 360);
        return;
      }
      const cmdSpan = document.createElement("span");
      cmdSpan.className = "cmd";
      el.appendChild(cmdSpan);
      let ci = 0;
      const typeChar = () => {
        if (cancelled) return;
        if (ci <= spec.cmd.length) {
          cmdSpan.textContent = spec.cmd.slice(0, ci);
          ci++;
          setTimeout(typeChar, spec.delay);
        } else {
          li++;
          setTimeout(typeLine, 420);
        }
      };
      typeChar();
    };
    const t = setTimeout(typeLine, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
      term.innerHTML = "";
    };
  }, []);
  return <div ref={ref} className={styles["termBody"]} id="term-body" />;
}
