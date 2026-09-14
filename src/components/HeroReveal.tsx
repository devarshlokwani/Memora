"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

/**
 * One orchestrated moment on arrival: the page writes itself onto the paper in
 * reading order, and the card drops onto the desk last. Everything marked
 * `data-reveal` joins the sequence, in document order.
 *
 * Deliberately the only load-time animation on the site — a page where every
 * section slides up as you scroll reads as templated, not designed.
 */
export function HeroReveal({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = scope.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const card = root.querySelector<HTMLElement>("[data-reveal-card]");

    if (prefersReducedMotion()) {
      gsap.set([...targets, card].filter(Boolean), { clearProps: "all", opacity: 1 });
      return;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline.from(targets, {
        y: 18,
        opacity: 0,
        duration: 0.7,
        stagger: 0.085,
      });

      if (card) {
        // Lands slightly off-square, like it was put down rather than placed.
        timeline.from(
          card,
          { y: 40, opacity: 0, rotate: "+=2.5", duration: 0.9 },
          "-=0.45",
        );
      }
    }, root);

    return () => context.revert();
  }, []);

  return <div ref={scope}>{children}</div>;
}
