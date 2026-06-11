"use client";
import { useEffect, useRef, type ReactNode, type JSX } from "react";

type Props = {
  delay?: 0 | 1 | 2 | 3 | 4;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children: ReactNode;
};

export function RevealOnScroll({ delay = 0, as = "div", className = "", children }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as as unknown as keyof JSX.IntrinsicElements;
  const dClass = delay ? ` d${delay}` : "";
  // Using `any` only for the ref because intrinsic element types are heterogeneous.
  const refProp = { ref } as unknown as Record<string, unknown>;
  // Compose JSX dynamically without losing type safety on consumers.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;
  return (
    <Component {...refProp} className={`reveal${dClass} ${className}`.trim()}>
      {children}
    </Component>
  );
}
