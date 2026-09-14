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

    const context = gsap.context(() => {
      gsap.fromTo(
        text,
        { yPercent: 105 },
        {
          yPercent: 0,
          duration: 1.1,
          /* power3 spends four fifths of the travel in the first fifth of the
             time: by the time the eye has found the word it has all but
             arrived. A gentler curve keeps it climbing long enough to watch. */
          ease: "power2.out",
          scrollTrigger: {
            trigger: clip,
            /* Off the clip itself, and measured from the foot of the screen in
               plain pixels rather than as a fraction of it.

               It used to hang off the whole footer at "top 80%", which was fine
               until the creator's note went in above this — that pushed the
               footer's top 800px clear of the wordmark, so the name had finished
               rising 600px of scroll before any of it was on screen. Nobody ever
               saw it move.

               A percentage start on an element this close to the end of the
               document is its own trap: the taller the window, the further up
               the page the trigger point sits, and past a certain height the
               page runs out of scroll before it is ever reached. An absolute
               offset does not move with the window at all. */
            start: "top bottom-=60",
            // play on the way in, put it away again on the way out.
            toggleActions: "play none none reset",
          },
        },
      );
    }, clip);

    /* The footer is the last thing on the page, so its trigger position is the
       sum of everything above it — and the landing page changes that height every
       time you pick a different section. Once the page gets shorter than it was
       when this was measured, the start point sits below where the page now ends
       and the word never comes up at all. Re-measure whenever the page resizes,
       once it has settled: a refresh mid-tween would run dozens of times. */
    let pending = 0;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(pending);
      pending = window.setTimeout(() => ScrollTrigger.refresh(), 140);
    });
    observer.observe(document.body);

    // The wordmark is enormous; when its face loads the page gets taller and
    // every measured trigger position moves with it.
    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});

    return () => {
      window.clearTimeout(pending);
      observer.disconnect();
      context.revert();
    };
  }, []);

  return (
    <div aria-hidden="true" ref={clipRef} className="overflow-hidden">
      <p
        ref={textRef}
        data-wordmark=""
        className="-mb-[0.17em] select-none text-center font-reading leading-[0.78] tracking-[-0.03em]"
        style={{
          fontSize: "clamp(3.5rem, 18vw, 13rem)",
          // A shallow diagonal fade rather than flat ink, so the letterforms
          // catch the light the way something set into the page would.
          backgroundImage:
            "linear-gradient(104deg, var(--color-ink) 0%, var(--color-ink-soft) 38%, #4c4647 72%, #6b6465 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Memora
      </p>
    </div>
  );
}
