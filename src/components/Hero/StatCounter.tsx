"use client";
import { useEffect, useRef, useState } from "react";

export function StatCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(el);
          const step = Math.max(1, Math.round(target / 28));
          let cur = 0;
          const tick = () => {
            cur = Math.min(target, cur + step);
            setValue(cur);
            if (cur < target) requestAnimationFrame(tick);
          };
          tick();
        }),
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return (
    <div ref={ref} className="num">
      {value}
      {suffix}
    </div>
  );
}
