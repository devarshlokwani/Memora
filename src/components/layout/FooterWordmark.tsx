"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * The name rising up inside the footer panel. The panel clips it, so it reads as
 * the word surfacing from within the block rather than a separate thing sliding
 * past behind it.
 *
 * Played rather than scrubbed, and reset on the way out, so it runs again every
 * time you come back down to the footer instead of sitting there already arrived.
 */
export function FooterWordmark() {
  const clipRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const clip = clipRef.current;
    const text = textRef.current;
    if (!clip || !text) return;

    if (prefersReducedMotion()) {
      gsap.set(text, { yPercent: 0 });
      return;
    }

    // Triggered off the whole footer, not this clip. The clip sits at the very
    // bottom of the document, and a range measured from there can never finish —
    // the page runs out of scroll before the end point arrives.
    const trigger = clip.closest("footer") ?? clip;

    const context = gsap.context(() => {
      gsap.fromTo(
        text,
        { yPercent: 105 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger,
            start: "top 80%",
            // play on the way in, put it away again on the way out.
            toggleActions: "play none none reset",
          },
        },
      );
    }, clip);

    // The wordmark is enormous; when its face loads the page gets taller and
    // every measured trigger position moves with it.
    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});

    return () => context.revert();
  }, []);

  return (
    <div aria-hidden="true" ref={clipRef} className="overflow-hidden">
      <p
        ref={textRef}
        data-wordmark=""
        className="-mb-[0.17em] select-none text-center font-reading leading-[0.78] tracking-[-0.03em] text-ink"
        style={{ fontSize: "clamp(3.5rem, 18vw, 13rem)" }}
      >
        Memora
      </p>
    </div>
  );
}
