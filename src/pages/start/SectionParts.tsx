import { useEffect, useRef, type ReactNode } from "react";
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { node.classList.add("is-visible"); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { node.classList.add("is-visible"); observer.disconnect(); }
    }, { threshold: .12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`start-reveal ${className}`}>{children}</div>;
}
export function Kicker({ number, children }: { number?: string; children: ReactNode }) {
  return <p className="start-section-kicker">{number && <span>{number}</span>}{children}</p>;
}
